"use strict";
/**
* strtr() for JavaScript
* Translate characters or replace substrings
*
* @author Dmitry Sheiko
* @version strtr.js, v 1.0.2
* @license MIT
* @copyright (c) Dmitry Sheiko http://dsheiko.com
**/
Object.defineProperty(exports, "__esModule", { value: true });
exports.cyr2lat = void 0;
const strtr = (string, dic) => {
    const str = string.toString(), makeToken = (inx) => `{{###~${inx}~###}}`, tokens = Object.keys(dic)
        .map((key, inx) => ({
        key,
        val: dic[key],
        token: makeToken(inx)
    })), tokenizedStr = tokens.reduce((carry, entry) => carry.replace(new RegExp(entry.key, "g"), entry.token), str);
    return tokens.reduce((carry, entry) => carry.replace(new RegExp(entry.token, "g"), entry.val), tokenizedStr);
};
const table = {
    'А': 'A',
    'Б': 'B',
    'В': 'V',
    'Г': 'G',
    'Д': 'D',
    'Е': 'E',
    'Ё': 'YO',
    'Ж': 'ZH',
    'З': 'Z',
    'И': 'I',
    'Й': 'J',
    'К': 'K',
    'Л': 'L',
    'М': 'M',
    'Н': 'N',
    'О': 'O',
    'П': 'P',
    'Р': 'R',
    'С': 'S',
    'Т': 'T',
    'У': 'U',
    'Ф': 'F',
    'Х': 'H',
    'Ц': 'CZ',
    'Ч': 'CH',
    'Ш': 'SH',
    'Щ': 'SHH',
    'Ъ': '',
    'Ы': 'Y',
    'Ь': '',
    'Э': 'E',
    'Ю': 'YU',
    'Я': 'YA',
    'а': 'a',
    'б': 'b',
    'в': 'v',
    'г': 'g',
    'д': 'd',
    'е': 'e',
    'ё': 'yo',
    'ж': 'zh',
    'з': 'z',
    'и': 'i',
    'й': 'j',
    'к': 'k',
    'л': 'l',
    'м': 'm',
    'н': 'n',
    'о': 'o',
    'п': 'p',
    'р': 'r',
    'с': 's',
    'т': 't',
    'у': 'u',
    'ф': 'f',
    'х': 'h',
    'ц': 'cz',
    'ч': 'ch',
    'ш': 'sh',
    'щ': 'shh',
    'ъ': '',
    'ы': 'y',
    'ь': '',
    'э': 'e',
    'ю': 'yu',
    'я': 'ya',
    ' ': '-'
};
function cyr2lat(str) {
    return strtr(str, table);
}
exports.cyr2lat = cyr2lat;
//# sourceMappingURL=cyr2lat.js.map