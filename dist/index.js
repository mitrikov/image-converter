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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
// import sharp from 'sharp'
const cyr2lat_1 = require("./cyr2lat");
const humanFileSize_1 = require("./humanFileSize");
const waitForKey_1 = __importDefault(require("./waitForKey"));
const sharp_1 = __importDefault(require("sharp"));
// const clipboardy =  require('clipboardy')
const prefix = "san-";
const sourceFolder = "./images/source";
const outputFolder = "./images/target";
const convertToWebp = true;
const maxWidthOrHeight = 800;
class ConvertionLogger {
    constructor() {
        this.totalCompressRatio = 0;
        this.filesCount = 0;
        this.outputFileNames = [];
    }
    logConvertionString(sourceFile, sourceFileName, convertedFile, outputFileName) {
        const sourceFileSize = (0, humanFileSize_1.humanFileSize)(sourceFile.byteLength);
        const outputFileSize = (0, humanFileSize_1.humanFileSize)(convertedFile.byteLength);
        const outputCompressRatio = 100 - convertedFile.byteLength / sourceFile.byteLength;
        console.log(`\x1b[34m${sourceFileName} - ${sourceFileSize}\x1b[0m -> \x1b[35m${outputFileName} - ${outputFileSize}\x1b[0m - (${outputCompressRatio.toFixed(2)}%)`);
        this.totalCompressRatio += outputCompressRatio;
        this.filesCount++;
    }
    logConvertionResult() {
        const averageCompressRatio = (this.totalCompressRatio / this.filesCount).toFixed(2);
        console.log(`Обработано файлов - ${this.filesCount}, (${averageCompressRatio}%)`);
    }
    copyToClipboard() {
        return __awaiter(this, void 0, void 0, function* () {
            const clipboardy = (yield import('clipboardy')).default;
            clipboardy.writeSync(this.outputFileNames.join('\n'));
        });
    }
}
const convertImage = (fileName, outputFileName, convertToWebp) => __awaiter(void 0, void 0, void 0, function* () {
    const file = node_fs_1.default.readFileSync(`${sourceFolder}/${fileName}`);
    outputFileName = outputFileName.replace(/\.(\w+)/, ".jpg");
    const result = yield (0, sharp_1.default)(file)
        .resize(maxWidthOrHeight, maxWidthOrHeight, {
        fit: 'inside'
    })
        .jpeg({
        quality: 80
    })
        .toBuffer();
    let resultWebp = null;
    let outputFileNameWebp = null;
    if (convertToWebp) {
        outputFileNameWebp = outputFileName.replace(/\.(\w+)/, ".webp");
        resultWebp = yield (0, sharp_1.default)(file)
            .resize(800, 800, {
            fit: 'inside'
        })
            .webp({
            quality: 80
        })
            .toBuffer();
        node_fs_1.default.writeFileSync(`${outputFolder}/${outputFileNameWebp}`, resultWebp);
    }
    node_fs_1.default.writeFileSync(`${outputFolder}/${outputFileName}`, result);
    return {
        sourceFile: file,
        outputFile: result,
        outputFileName,
        outputFileWebp: resultWebp,
        outputFileNameWebp
    };
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const logger = new ConvertionLogger();
    const images = node_fs_1.default.readdirSync(sourceFolder);
    for (let sourceFileName of images) {
        const transliteratedName = prefix + (0, cyr2lat_1.cyr2lat)(sourceFileName.toLowerCase());
        const { sourceFile, outputFile, outputFileName, outputFileWebp, outputFileNameWebp } = yield convertImage(sourceFileName, transliteratedName, convertToWebp);
        logger.logConvertionString(sourceFile, sourceFileName, outputFile, outputFileName);
        if (convertToWebp)
            logger.logConvertionString(sourceFile, sourceFileName, outputFileWebp, outputFileNameWebp);
    }
    logger.logConvertionResult();
    yield logger.copyToClipboard();
    console.log('Нажмите любую клавишу для выхода...');
    yield (0, waitForKey_1.default)(10);
});
main();
//# sourceMappingURL=index.js.map