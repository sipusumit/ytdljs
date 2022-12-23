import https = require("https")


function get(url:string, callback:any){
    "use-strict";
    https.get(url, function(result){
        var dataQueue = ""
        result.on("data", function(dataBuffer){
            dataQueue += dataBuffer
        });

        result.on("end", function(){
            callback(dataQueue);
        })
    })
}

async function getAsync(url:string){
    let newUrl = new URL(url)
    return new Promise((resolve) =>{
        let data = ''
        https.get(url, res =>{
            res.on('data', chunk => { data += chunk})
            res.on('end', ()=>{resolve(data)})
        })
    })
}

function _or_null(a:any, prop:any){
    if(a.hasOwnProperty(prop)){
        return a[prop];
    }else return null;
}
// async function getAsync(url:string){
//     let newUrl = new URL(url)
//     return new Promise((resolve) =>{
//         let data = ''
//         https.get({hostname:newUrl.hostname, path:newUrl.pathname, headers:{'Accept-Encoding': 'gzip, deflate, br'}}, res =>{
//             res.on('data', chunk => { data += chunk})
//             res.on('end', ()=>{resolve(data)})
//         })
//     })
// }


function qualities(quality_ids:string[]){
    function q(qid:string){
        try {
            return quality_ids.indexOf(qid)
        } catch (error) {
            return -1
        }
    }
    return q
}

function isNullOrWhitespace(input:string){
    return !input || !input.trim();
}

function escapeRegExp(string:string){
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseQS(qs:string){
    var query:any = {}
    var pairs = (qs[0] === '?' ? qs.substr(1) : qs).split('&')
    pairs.forEach(p =>{
        let pair = p.split("=")
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1])
    })
    return query;
}

function mimetype2ext(mt:string){
    if(isNullOrWhitespace(mt)) return;
    let ext = {
        'audio/mp4': 'm4a',
        'audio/mpeg': 'mp3'
    }[mt];
    if(!isNullOrWhitespace(ext)) return ext;
}

function parseCodec(codecStr:string){
    if(isNullOrWhitespace(codecStr)) return {}
    
}

export {qualities, get, getAsync, isNullOrWhitespace, parseQS, escapeRegExp, _or_null, mimetype2ext}