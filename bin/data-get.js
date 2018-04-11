#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const url = require('url')
const mkdirp = require('mkdirp')
const minimist = require('minimist')
const {Dataset, File, isDataset, parseDatasetIdentifier} = require('data.js')
const {get, config} = require('datahub-client')
const unzip = require('unzip')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const wait = require('../lib/utils/output/wait')
const {handleError} = require('../lib/utils/error')

const argv = minimist(process.argv.slice(2), {
  string: ['get'],
  boolean: ['help', 'debug'],
  alias: {help: 'h'}
})

const getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/get.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

let identifier = argv._[0]

const run = async () => {
  const stopSpinner = wait('Loading...')
  try {
    const start = new Date()
    let pathToSave
    const parsedIdentifier = await parseDatasetIdentifier(identifier)
    const itIsDataset = isDataset(identifier)
    const githubDataset = parsedIdentifier.type === 'github' && parsedIdentifier.name.slice((parsedIdentifier.name.lastIndexOf('.') - 1 >>> 0) + 2) === ''

    if (itIsDataset || githubDataset) {
      const dataset = await Dataset.load(identifier)
      const owner = dataset.identifier.owner || ''
      const name = dataset.identifier.name

      pathToSave = path.join(owner, name)

      if (!checkDestIsEmpty(owner, name)) {
        throw new Error(`${owner}/${name} is not empty!`)
      }

      /** usual dataset download */
      const allResources = await get(dataset)
      // Save all files on disk
      const myPromises = allResources.map(async resource => {
        return saveIt(owner, name, resource)
      })
      await Promise.all(myPromises)

    } else if (parsedIdentifier.type === "datahub") {
      // Remove trailing slash:
      if(identifier.substr(-1) === '/' && identifier.length > 1) {
        identifier = identifier.slice(0, identifier.length - 1)
      }
      // We assume that if /r/ is in identifier then it's r link.
      if (identifier.includes('/r/')) {
        pathToSave = await saveFileFromUrl(identifier, argv.format)
      } else {
        // Try to guess owner and dataset name here. We're not loading Dataset object
        // because we want to handle private datasets as well:
        const idParts = identifier.split('/')
        const owner = idParts[idParts.length - 2]
        const name = idParts[idParts.length - 1]
        const token = config.get('token')
        pathToSave = path.join(owner, name)

        if (!checkDestIsEmpty(owner, name)) {
          throw new Error(`${owner}/${name} is not empty!`)
        }

        /** For datasets from the datahub we get zipped version and unzip it.
                - less traffic
                - zipped version has a fancy file structure
            #issue: https://github.com/datahq/datahub-qa/issues/86  */
        const zipped_dataset_url  = `https://datahub.io/${owner}/${name}/r/${name}_zip.zip?jwt=${token}`
        const archive_path = await saveFileFromUrl(zipped_dataset_url, 'zip')
        // unzip archive into destination folder
        fs.createReadStream(archive_path)
          .pipe(unzip.Extract({ path: pathToSave }))
          // removing the archive file once we extracted all the dataset files
          .on('finish', () => {fs.unlinkSync(archive_path)})
      }
    } else { // If it is not a dataset - download the file
      if (parsedIdentifier.type === 'github' && !githubDataset) {
        identifier += `?raw=true`
      }
      pathToSave = await saveFileFromUrl(identifier, argv.format)
    }

    // show time statistic & success message
    stopSpinner()
    const end = new Date() - start
    console.log(`Time elapsed: ${(end / 1000).toFixed(2)} s`)
    console.log(`Dataset/file is saved in "${pathToSave}"`)

  } catch (err) {
    stopSpinner()
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    await handleError(err)
    process.exit(1)
  }
}

run()

/**
 * Download file from url and save it locally using data.js 'File' object.
 * returns path, where the file was saved ( ${filename}.${fileformat} )
 * Using:  let savedPath = await saveFileFromUrl(url, format)
 * @param url: url to get the file
 * @param format: csv, json, zip, etc
 * @returns {Promise}
 */
const saveFileFromUrl = (url, format) => {
  return new Promise(async (resolve, reject) =>{
    const file = await File.load(url, {format: format})
    const destPath = [file.descriptor.name, file.descriptor.format].join('.')
    let stream
    try {
      stream = await file.stream()
    } catch (err) {
      if (err.message === 'Not Found') {
        err.message += ' or Forbidden.'
      }
      await handleError(err)
      process.exit(1)
    }
    stream.pipe(fs.createWriteStream(destPath)).on('finish', () => {
      resolve(destPath)
    })
  })
}

const saveIt = (owner, name, resource) => {
  return new Promise(async (resolve, reject) => {
    // We only can save if path is defined
    if (resource.descriptor.path) {
      const pathParts = url.parse(resource.descriptor.path)
      let destPath
      if (pathParts.protocol === 'http:' || pathParts.protocol === 'https:') {
        const relativePath = resource.descriptor.path.split('/').slice(5).join('/')
        destPath = path.join(owner, name, relativePath)
      } else {
        destPath = path.join(owner, name, resource.descriptor.path)
      }
      mkdirp.sync(path.dirname(destPath))
      const stream = await resource.stream()
      stream.pipe(fs.createWriteStream(destPath)).on('finish', () => {
        resolve()
      })
    }
  })
}

// TODO: Move this somewhere to utils
const checkDestIsEmpty = (owner, name) => {
  const dest = path.join(owner, name)
  return !fs.existsSync(dest) || fs.readdirSync(dest).length === 0;
}

module.exports = {
  checkDestIsEmpty
}
