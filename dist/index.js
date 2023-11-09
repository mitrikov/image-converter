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
const sharp_1 = __importDefault(require("sharp"));
const glob_1 = require("glob");
// const clipboardy =  require('clipboardy')
// TODO: Если тире обрамлено пробелами, то заменять на просто тире
const prefix = "";
const sourceFolder = "./images/source";
const outputFolder = "./images/target";
const isConvertToWebp = true;
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
        const outputCompressRatio = 100 - (convertedFile.byteLength / sourceFile.byteLength) * 100;
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
function writeFileSyncRecursive(filename, content) {
    // -- normalize path separator to '/' instead of path.sep, 
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g, '/');
    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') {
        root = '/';
        filepath = filepath.slice(1);
    }
    else if (filepath[1] === ':') {
        root = filepath.slice(0, 3); // c:\
        filepath = filepath.slice(3);
    }
    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1); // remove last item, file
    folders.reduce((acc, folder) => {
        const folderPath = acc + folder + '/';
        if (!node_fs_1.default.existsSync(folderPath)) {
            node_fs_1.default.mkdirSync(folderPath);
        }
        return folderPath;
    }, root // first 'acc', important
    );
    // -- write file
    node_fs_1.default.writeFileSync(root + filepath, content);
}
const readDirRecursive = (files) => {
    const result = [];
    for (let i = 1; i < files.length; i++) {
        const path = files[i];
        if (path.isFile()) {
            let item = path;
            let parents = [];
            while (item) {
                item = item.parent;
                if (item.name === "images" || item.name === "source")
                    break;
                parents.push(item.name);
            }
            result.push({
                path: parents.length ? parents.reverse().join("/") + "/" : '',
                name: path.name
            });
        }
    }
    return result;
};
const convertImage = (fileName, outputFileName, convertToWebp) => __awaiter(void 0, void 0, void 0, function* () {
    const file = node_fs_1.default.readFileSync(fileName);
    outputFileName = outputFileName.replace(/\.(\w+)/, ".jpg");
    const result = yield (0, sharp_1.default)(file)
        .resize(maxWidthOrHeight, maxWidthOrHeight, {
        fit: 'inside',
        withoutEnlargement: true
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
            .resize(maxWidthOrHeight, maxWidthOrHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
            .webp({
            quality: 80
        })
            .toBuffer();
        writeFileSyncRecursive(outputFileNameWebp, resultWebp);
    }
    writeFileSyncRecursive(outputFileName, result);
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
    const images = yield (0, glob_1.glob)(sourceFolder + "/**", { withFileTypes: true });
    const result = readDirRecursive(images);
    node_fs_1.default.rmSync(outputFolder, { recursive: true, force: true });
    for (let file of result) {
        const transliteratedName = prefix + (0, cyr2lat_1.cyr2lat)(file.name.toLowerCase());
        const sourcePath = sourceFolder + "/" + file.path + file.name;
        const outputPath = outputFolder + "/" + file.path + transliteratedName;
        const { sourceFile, outputFile, outputFileName, outputFileWebp, outputFileNameWebp } = yield convertImage(sourcePath, outputPath, isConvertToWebp);
        if (isConvertToWebp)
            logger.logConvertionString(sourceFile, sourcePath, outputFileWebp, outputFileNameWebp);
        logger.logConvertionString(sourceFile, sourcePath, outputFile, outputFileName);
    }
    // console.log(files)
    logger.logConvertionResult();
    yield logger.copyToClipboard();
    console.log('Нажмите любую клавишу для выхода...');
    // await waitForAnyKey(10)
});
main();
//# sourceMappingURL=index.js.map