import axios from "axios";
import { escapeRegExp, get, getAsync, isNullOrWhitespace, parseQS, qualities, _or_null} from "./utils";

class YTDL {
    BASE_URL:string;
    Title:string;
    Author:string;
    Length:string;
    ViewCounts:string;
    Username:string;
    BestThumb:string;
    Expiry:string;
    URLS:{property:string};

    // Private
    #WEBPAGE:string;
    #PLAYER_URL:string;
    #CODE:string;
    #FUNC:string;
    #OPERATIONS:any;

    // Test
    PLAYER_RESPONSE:any
    VIDEO_DETAILS:Object
    

    constructor(url:string){
        this.BASE_URL = url;
        // get(this.BASE_URL, (response:string)=>{
        //     this.#WEBPAGE = response
        //     this.#callback()
        // })
    }

    async setup(){
        this.#WEBPAGE = await getAsync(this.BASE_URL) as string
        await this.#callback()
    }

    async #callback(){
        // Extract playerResponse json and video Details
        this.PLAYER_RESPONSE = JSON.parse(this.#WEBPAGE.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/)[1]);
        this.VIDEO_DETAILS = this.PLAYER_RESPONSE["videoDetails"] || {}

        let formats = []
        let formatsNoVideo = []
        let itags = []
        let itag_qualities:any = {}
        // get player base.js url
        this.extractPlayerUrl()
        // extract Entry Function Name
        await this.parseSigJS()
        let q = qualities(['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160', 'hd2880', 'highres'])
        let streaming_data = this.PLAYER_RESPONSE["streamingData"] || {}
        let streaming_formats = streaming_data["formats"] || []
        streaming_formats = streaming_formats.concat(streaming_data["adaptiveFormats"] || [])
        for(const fmt of streaming_formats){
            if(fmt["targetDurationSec"] || fmt[""]) return;
            let itag = fmt["itag"] || null;
            let quality = fmt["quality"]
            if(itag && quality){
                itag_qualities[itag] = quality;
            }
            if(fmt["type"] == "FORMAT_STREAM_TYPE_OTF") return;
            let fmt_url:string = fmt["url"]
            let sc:any;
            let encryptedSig:string;
            let signature:string;
            if(isNullOrWhitespace(fmt_url)){
                sc = parseQS(fmt["signatureCipher"])
                fmt_url = sc["url"] || null
                encryptedSig = sc["s"]
                !this.#PLAYER_URL && (this.extractPlayerUrl())
                if(!this.#PLAYER_URL) return;
                signature = this.decryptSignature(encryptedSig)
                fmt_url = `${fmt_url}&${sc['sp']}=${signature}`
                let mimetype = fmt["mimeType"]
                let mobj = mimetype.match(/((?:[^/]+)(?:[^;]+))(?:;\s*codecs="([^"]+)")?/)
            }
            // console.log(`${quality}:  ${fmt_url}\n\n`);
            // TODO
            // if(itag){
            //     itags.push(itag)
            // }
            // let tbr = fmt["averageBitrate"] || fmt["bitrate"] || null;
            // let dct = {
            //     'asr': _or_null(fmt,'audioSampleRate'),

            // }
        }
        
    }

    extractPlayerUrl(){
        if(this.#PLAYER_URL != null && this.#PLAYER_URL.trim() != "") return;
        let playerUrl = this.#WEBPAGE.match(/"(?:PLAYER_JS_URL|jsUrl)"\s*:\s*"([^"]+)"/)[1]
        if(!playerUrl) return;
        if(playerUrl.startsWith('//')){
            playerUrl = 'https:' + playerUrl
        }
        else if(!playerUrl.match(/https?:\/\//)){
            playerUrl = new URL(playerUrl, "https://youtube.com").href
        }
        this.#PLAYER_URL = playerUrl;
        
    }

    async getPlayerCode(){
        this.#CODE = (await axios.get(this.#PLAYER_URL)).data
    }

    async parseSigJS(){
        if(this.#FUNC) return;
        if(this.#CODE == null){
            await this.getPlayerCode()    
        }
        this.#FUNC = this.#CODE.match(/(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=function\(\s*a\s*\)\s*{\s*\s*a\s*=\s*a\.split\(\s*\"\"\s*\);[a-zA-Z0-9$]{2,}\.[a-zA-Z0-9$]{2,}\(a,\d+\)/)[1]
    }

    decryptSignature(sig:string) {
        if(this.#PLAYER_URL == null) throw new Error("Cannot Decrypt Signature Without Player Url")
        !this.#OPERATIONS && (this.getOperations())
        let sigArr = sig.split("")
        this.#OPERATIONS.forEach((cmd:string) =>{eval(cmd.replace("<sig>","sigArr"))})
        return sigArr.join("")
    }

    getOperations(){
        let operations:any = [];

        let entryPointBody = this.#CODE.match(new RegExp(`(?!h\\.)${escapeRegExp(this.#FUNC)}=function\\(\\w+\\)\\{(.*?)\\}`))[1]
        let entryPointLines = entryPointBody.split(';');

        let reverseFuncName:string, sliceFuncName:string, charSwapFuncName:string;
        
        entryPointLines.forEach(line =>{
            if(!isNullOrWhitespace(reverseFuncName) && !isNullOrWhitespace(sliceFuncName) && !isNullOrWhitespace(charSwapFuncName)) return;
            let calledFuncName = line.match(/\w+\.(\w+)\(/)[1]
            if(isNullOrWhitespace(calledFuncName)) return;
            
            if(this.#CODE.match(new RegExp(`${calledFuncName}:\\bfunction\\b\\(\\w+\\)`))){
                reverseFuncName = calledFuncName
            }
            else if(this.#CODE.match(new RegExp(`${calledFuncName}:\\bfunction\\b\\([a],b\\).(\\breturn\\b)?.?\\w+\\.`))){
                sliceFuncName = calledFuncName
            }
            else if(this.#CODE.match(new RegExp(`${calledFuncName}:\\bfunction\\b\\(\\w+\\,\\w\\).\\bvar\\b.\\bc=a\\b`))){
                charSwapFuncName = calledFuncName
            }
        })

        entryPointLines.forEach(line =>{
            let calledFuncName = line.match(/\w+\.(\w+)\(/)[1]
            if(isNullOrWhitespace(calledFuncName)) return;

            if(calledFuncName == charSwapFuncName){
                let index = line.match(/\(\w+,(\d+)\)/)[1]
                operations.push(`this.Swap(sigArr,${index})`)
            }
            else if (calledFuncName == sliceFuncName){
                var index = line.match(/\(\w+,(\d+)\)/)[1]
                operations.push(`sigArr.splice(0,${index})`)
            }
            else if (calledFuncName == reverseFuncName){
                operations.push(`sigArr.reverse()`)
            }
        })
        this.#OPERATIONS = operations;
    }

    Swap(a:any,b:any){var c=a[0];a[0]=a[b%a.length];a[b%a.length]=c}
}

export {YTDL}