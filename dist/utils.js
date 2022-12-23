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
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeRegExp = exports.parseQS = exports.isNullOrWhitespace = exports.getAsync = exports.get = exports.qualities = void 0;
const https = require("https");
function get(url, callback) {
    "use-strict";
    https.get(url, function (result) {
        var dataQueue = "";
        result.on("data", function (dataBuffer) {
            dataQueue += dataBuffer;
        });
        result.on("end", function () {
            callback(dataQueue);
        });
    });
}
exports.get = get;
function getAsync(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let newUrl = new URL(url);
        return new Promise((resolve) => {
            let data = '';
            https.get(url, res => {
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => { resolve(data); });
            });
        });
    });
}
exports.getAsync = getAsync;
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
function qualities(quality_ids) {
    function q(qid) {
        try {
            return quality_ids.indexOf(qid);
        }
        catch (error) {
            return -1;
        }
    }
    return q;
}
exports.qualities = qualities;
function isNullOrWhitespace(input) {
    return !input || !input.trim();
}
exports.isNullOrWhitespace = isNullOrWhitespace;
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;
function parseQS(qs) {
    var query = {};
    var pairs = (qs[0] === '?' ? qs.substr(1) : qs).split('&');
    pairs.forEach(p => {
        let pair = p.split("=");
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    });
    return query;
}
exports.parseQS = parseQS;
//# sourceMappingURL=utils.js.map