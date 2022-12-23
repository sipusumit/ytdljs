"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _YTDL_instances, _YTDL_WEBPAGE, _YTDL_PLAYER_URL, _YTDL_CODE, _YTDL_FUNC, _YTDL_OPERATIONS, _YTDL_callback;
Object.defineProperty(exports, "__esModule", { value: true });
exports.YTDL = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("./utils");
class YTDL {
    constructor(url) {
        _YTDL_instances.add(this);
        // Private
        _YTDL_WEBPAGE.set(this, void 0);
        _YTDL_PLAYER_URL.set(this, void 0);
        _YTDL_CODE.set(this, void 0);
        _YTDL_FUNC.set(this, void 0);
        _YTDL_OPERATIONS.set(this, void 0);
        this.BASE_URL = url;
        // get(this.BASE_URL, (response:string)=>{
        //     this.#WEBPAGE = response
        //     this.#callback()
        // })
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldSet(this, _YTDL_WEBPAGE, yield (0, utils_1.getAsync)(this.BASE_URL), "f");
            yield __classPrivateFieldGet(this, _YTDL_instances, "m", _YTDL_callback).call(this);
        });
    }
    extractPlayerUrl() {
        if (__classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f") != null && __classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f").trim() != "")
            return;
        let playerUrl = __classPrivateFieldGet(this, _YTDL_WEBPAGE, "f").match(/"(?:PLAYER_JS_URL|jsUrl)"\s*:\s*"([^"]+)"/)[1];
        if (!playerUrl)
            return;
        if (playerUrl.startsWith('//')) {
            playerUrl = 'https:' + playerUrl;
        }
        else if (!playerUrl.match(/https?:\/\//)) {
            playerUrl = new URL(playerUrl, "https://youtube.com").href;
        }
        __classPrivateFieldSet(this, _YTDL_PLAYER_URL, playerUrl, "f");
    }
    getPlayerCode() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldSet(this, _YTDL_CODE, (yield axios_1.default.get(__classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f"))).data, "f");
        });
    }
    parseSigJS() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _YTDL_FUNC, "f"))
                return;
            if (__classPrivateFieldGet(this, _YTDL_CODE, "f") == null) {
                yield this.getPlayerCode();
            }
            __classPrivateFieldSet(this, _YTDL_FUNC, __classPrivateFieldGet(this, _YTDL_CODE, "f").match(/(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=function\(\s*a\s*\)\s*{\s*\s*a\s*=\s*a\.split\(\s*\"\"\s*\);[a-zA-Z0-9$]{2,}\.[a-zA-Z0-9$]{2,}\(a,\d+\)/)[1], "f");
        });
    }
    decryptSignature(sig) {
        if (__classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f") == null)
            throw new Error("Cannot Decrypt Signature Without Player Url");
        !__classPrivateFieldGet(this, _YTDL_OPERATIONS, "f") && (this.getOperations());
        let sigArr = sig.split("");
        __classPrivateFieldGet(this, _YTDL_OPERATIONS, "f").forEach((cmd) => { eval(cmd.replace("<sig>", "sigArr")); });
        return sigArr.join("");
    }
    getOperations() {
        let operations = [];
        let entryPointBody = __classPrivateFieldGet(this, _YTDL_CODE, "f").match(new RegExp(`(?!h\\.)${(0, utils_1.escapeRegExp)(__classPrivateFieldGet(this, _YTDL_FUNC, "f"))}=function\\(\\w+\\)\\{(.*?)\\}`))[1];
        let entryPointLines = entryPointBody.split(';');
        let reverseFuncName, sliceFuncName, charSwapFuncName;
        entryPointLines.forEach(line => {
            if (!(0, utils_1.isNullOrWhitespace)(reverseFuncName) && !(0, utils_1.isNullOrWhitespace)(sliceFuncName) && !(0, utils_1.isNullOrWhitespace)(charSwapFuncName))
                return;
            let calledFuncName = line.match(/\w+\.(\w+)\(/)[1];
            if ((0, utils_1.isNullOrWhitespace)(calledFuncName))
                return;
            if (__classPrivateFieldGet(this, _YTDL_CODE, "f").match(new RegExp(`${calledFuncName}:\\bfunction\\b\\(\\w+\\)`))) {
                reverseFuncName = calledFuncName;
            }
            else if (__classPrivateFieldGet(this, _YTDL_CODE, "f").match(new RegExp(`${calledFuncName}:\\bfunction\\b\\([a],b\\).(\\breturn\\b)?.?\\w+\\.`))) {
                sliceFuncName = calledFuncName;
            }
            else if (__classPrivateFieldGet(this, _YTDL_CODE, "f").match(new RegExp(`${calledFuncName}:\\bfunction\\b\\(\\w+\\,\\w\\).\\bvar\\b.\\bc=a\\b`))) {
                charSwapFuncName = calledFuncName;
            }
        });
        entryPointLines.forEach(line => {
            let calledFuncName = line.match(/\w+\.(\w+)\(/)[1];
            if ((0, utils_1.isNullOrWhitespace)(calledFuncName))
                return;
            if (calledFuncName == charSwapFuncName) {
                let index = line.match(/\(\w+,(\d+)\)/)[1];
                operations.push(`this.Swap(sigArr,${index})`);
            }
            else if (calledFuncName == sliceFuncName) {
                var index = line.match(/\(\w+,(\d+)\)/)[1];
                operations.push(`sigArr.splice(0,${index})`);
            }
            else if (calledFuncName == reverseFuncName) {
                operations.push(`sigArr.reverse()`);
            }
        });
        __classPrivateFieldSet(this, _YTDL_OPERATIONS, operations, "f");
    }
    Swap(a, b) { var c = a[0]; a[0] = a[b % a.length]; a[b % a.length] = c; }
}
exports.YTDL = YTDL;
_YTDL_WEBPAGE = new WeakMap(), _YTDL_PLAYER_URL = new WeakMap(), _YTDL_CODE = new WeakMap(), _YTDL_FUNC = new WeakMap(), _YTDL_OPERATIONS = new WeakMap(), _YTDL_instances = new WeakSet(), _YTDL_callback = function _YTDL_callback() {
    return __awaiter(this, void 0, void 0, function* () {
        // Extract playerResponse json and video Details
        this.PLAYER_RESPONSE = JSON.parse(__classPrivateFieldGet(this, _YTDL_WEBPAGE, "f").match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/)[1]);
        this.VIDEO_DETAILS = this.PLAYER_RESPONSE["videoDetails"] || {};
        let formats = [];
        let formatsNoVideo = [];
        let itags = [];
        let itag_qualities = {};
        // get player base.js url
        this.extractPlayerUrl();
        // extract Entry Function Name
        yield this.parseSigJS();
        let q = (0, utils_1.qualities)(['tiny', 'small', 'medium', 'large', 'hd720', 'hd1080', 'hd1440', 'hd2160', 'hd2880', 'highres']);
        let streaming_data = this.PLAYER_RESPONSE["streamingData"] || {};
        let streaming_formats = streaming_data["formats"] || [];
        streaming_formats = streaming_formats.concat(streaming_data["adaptiveFormats"] || []);
        for (const fmt of streaming_formats) {
            if (fmt["targetDurationSec"] || fmt[""])
                return;
            let itag = fmt["itag"] || null;
            let quality = fmt["quality"];
            if (itag && quality) {
                itag_qualities[itag] = quality;
            }
            if (fmt["type"] == "FORMAT_STREAM_TYPE_OTF")
                return;
            let fmt_url = fmt["url"];
            let sc;
            let encryptedSig;
            let signature;
            if ((0, utils_1.isNullOrWhitespace)(fmt_url)) {
                sc = (0, utils_1.parseQS)(fmt["signatureCipher"]);
                fmt_url = sc["url"] || null;
                encryptedSig = sc["s"];
                !__classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f") && (this.extractPlayerUrl());
                if (!__classPrivateFieldGet(this, _YTDL_PLAYER_URL, "f"))
                    return;
                signature = this.decryptSignature(encryptedSig);
                fmt_url = `${fmt_url}&${sc['sp']}=${signature}`;
            }
            console.log(`${quality}:  ${fmt_url}\n\n`);
        }
    });
};
//# sourceMappingURL=ytdl.js.map