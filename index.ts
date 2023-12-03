import fs from 'node:fs'
// import sharp from 'sharp'
import { cyr2lat } from './cyr2lat'
import { humanFileSize } from './humanFileSize'
import waitForAnyKey from './waitForKey'
import sharp from 'sharp'
import { glob } from 'glob'
// const clipboardy =  require('clipboardy')

// TODO: Если тире обрамлено пробелами, то заменять на просто тире

const prefix = "pelm-"
const sourceFolder = "./images/source"
const outputFolder = "./images/target"
const isConvertToWebp = false
const maxWidthOrHeight = 800
const quality = 90

class ConvertionLogger {
    totalCompressRatio : number
    filesCount : number
    outputFileNames : string[]

    constructor() {
        this.totalCompressRatio = 0
        this.filesCount = 0
        this.outputFileNames = []
    }

    logConvertionString(sourceFile, sourceFileName, convertedFile, outputFileName) {
        const sourceFileSize = humanFileSize(sourceFile.byteLength)
        const outputFileSize = humanFileSize(convertedFile.byteLength)
        const outputCompressRatio = 100 - (convertedFile.byteLength / sourceFile.byteLength) * 100

        console.log(`\x1b[34m${sourceFileName} - ${sourceFileSize}\x1b[0m -> \x1b[35m${outputFileName} - ${outputFileSize}\x1b[0m - (${outputCompressRatio.toFixed(2)}%)`)
        this.totalCompressRatio += outputCompressRatio
        this.outputFileNames.push(outputFileName.replace(/^.*[\\\/]/, ''))
        this.filesCount++
    }

    logConvertionResult() {
        const averageCompressRatio = (this.totalCompressRatio / this.filesCount).toFixed(2)
        console.log(`Обработано файлов - ${this.filesCount}, (${averageCompressRatio}%)`)
    }

    async copyToClipboard() {
        const clipboardy = (await import('clipboardy')).default
        clipboardy.writeSync(this.outputFileNames.join('\n'))
    }
}

function writeFileSyncRecursive(filename, content) {
    // -- normalize path separator to '/' instead of path.sep, 
    // -- as / works in node for Windows as well, and mixed \\ and / can appear in the path
    let filepath = filename.replace(/\\/g,'/');  
  
    // -- preparation to allow absolute paths as well
    let root = '';
    if (filepath[0] === '/') { 
      root = '/'; 
      filepath = filepath.slice(1);
    } 
    else if (filepath[1] === ':') { 
      root = filepath.slice(0,3);   // c:\
      filepath = filepath.slice(3); 
    }
  
    // -- create folders all the way down
    const folders = filepath.split('/').slice(0, -1);  // remove last item, file
    folders.reduce(
      (acc, folder) => {
        const folderPath = acc + folder + '/';
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath);
        }
        return folderPath
      },
      root // first 'acc', important
    ); 
    
    // -- write file
    fs.writeFileSync(root + filepath, content);
}

const readDirRecursive = <T extends {path: string, name: string}[]>(files : Array<any>)  : T => {
    const result = [] as T
    
    for(let i = 1; i < files.length; i++) {
        const path = files[i]

        if(path.isFile()) {
            let item = path
            let parents = []
            while(item) {
                item = item.parent
                if(item.name === "images" || item.name === "source") break; 
                parents.push(item.name)
            }
            result.push({
                path : parents.length ? parents.reverse().join("/") + "/" : '',
                name: path.name
            })
        }
    }
    return result
}

const convertImage = async (fileName : string, outputFileName : string, convertToWebp? : boolean) => {
    const file = fs.readFileSync(fileName)
    outputFileName = outputFileName.replace(/\.(\w+)/, ".jpg")
    const result = await sharp(file)
        .resize(maxWidthOrHeight, maxWidthOrHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .jpeg({
            quality: quality
        })
        .toBuffer()
    
    let resultWebp = null
    let outputFileNameWebp = null

    if(convertToWebp) {
        outputFileNameWebp = outputFileName.replace(/\.(\w+)/, ".webp")
        resultWebp = await sharp(file)
        .resize(maxWidthOrHeight, maxWidthOrHeight, {
            fit: 'inside',
            withoutEnlargement: true
        })
        .webp({
            quality: quality
        })
        .toBuffer()

        writeFileSyncRecursive(outputFileNameWebp, resultWebp)
    }

    writeFileSyncRecursive(outputFileName, result)

    return {
        sourceFile : file,
        outputFile : result,
        outputFileName,
        outputFileWebp : resultWebp,
        outputFileNameWebp
    }
}

const main = async () => {
    const logger = new ConvertionLogger()
    const images = await glob(sourceFolder + "/**", {withFileTypes: true })

    const result = readDirRecursive(images)
    
    fs.rmSync(outputFolder, { recursive: true, force: true })

    for(let file of result){
        const transliteratedName = prefix + cyr2lat(file.name.toLowerCase())
        const sourcePath = sourceFolder + "/" + file.path + file.name
        const outputPath = outputFolder + "/" + file.path + transliteratedName
        const {
            sourceFile, 
            outputFile, 
            outputFileName,
            outputFileWebp, 
            outputFileNameWebp
        } = await convertImage(sourcePath, outputPath, isConvertToWebp)

        if(isConvertToWebp) logger.logConvertionString(sourceFile, sourcePath, outputFileWebp, outputFileNameWebp)
        logger.logConvertionString(sourceFile, sourcePath, outputFile, outputFileName)
    }

    logger.logConvertionResult()
    await logger.copyToClipboard()

    // console.log('Нажмите любую клавишу для выхода...')
    // await waitForAnyKey(10)
}

main()


