import fs from 'node:fs'
// import sharp from 'sharp'
import { cyr2lat } from './cyr2lat'
import { humanFileSize } from './humanFileSize'
import waitForAnyKey from './waitForKey'
import sharp from 'sharp'
// const clipboardy =  require('clipboardy')

const prefix = "san-"
const sourceFolder = "./images/source"
const outputFolder = "./images/target"
const convertToWebp = true
const maxWidthOrHeight = 800

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
        const outputCompressRatio = 100 - convertedFile.byteLength / sourceFile.byteLength

        console.log(`\x1b[34m${sourceFileName} - ${sourceFileSize}\x1b[0m -> \x1b[35m${outputFileName} - ${outputFileSize}\x1b[0m - (${outputCompressRatio.toFixed(2)}%)`)
        this.totalCompressRatio += outputCompressRatio
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

const convertImage = async (fileName : string, outputFileName : string, convertToWebp? : boolean) => {
    const file = fs.readFileSync(`${sourceFolder}/${fileName}`)
    outputFileName = outputFileName.replace(/\.(\w+)/, ".jpg")
    const result = await sharp(file)
        .resize(maxWidthOrHeight, maxWidthOrHeight, {
            fit: 'inside'
        })
        .jpeg({
            quality: 80
        })
        .toBuffer()
    
    let resultWebp = null
    let outputFileNameWebp = null

    if(convertToWebp) {
        outputFileNameWebp = outputFileName.replace(/\.(\w+)/, ".webp")
        resultWebp = await sharp(file)
        .resize(800, 800, {
            fit: 'inside'
        })
        .webp({
            quality: 80
        })
        .toBuffer()

        fs.writeFileSync(`${outputFolder}/${outputFileNameWebp}`, resultWebp)
    }

    fs.writeFileSync(`${outputFolder}/${outputFileName}`, result)

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
    const images = fs.readdirSync(sourceFolder)
    
    for(let sourceFileName of images) {
        const transliteratedName = prefix + cyr2lat(sourceFileName.toLowerCase())
        const {
            sourceFile, 
            outputFile, 
            outputFileName,
            outputFileWebp, 
            outputFileNameWebp
        } = await convertImage(sourceFileName, transliteratedName, convertToWebp)

        logger.logConvertionString(sourceFile, sourceFileName, outputFile, outputFileName)
        if(convertToWebp) logger.logConvertionString(sourceFile, sourceFileName, outputFileWebp, outputFileNameWebp)
    }

    logger.logConvertionResult()
    await logger.copyToClipboard()

    console.log('Нажмите любую клавишу для выхода...')
    await waitForAnyKey(10)
}

main()


