#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const url = require('url')
const mkdirp = require('mkdirp')
const minimist = require('minimist')
const {Dataset, File, isDataset, parseDatasetIdentifier} = require('data.js')
const {get} = require('datahub-client')
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
    let savedPath
    const parsedIdentifier = await parseDatasetIdentifier(identifier)
    const itIsDataset = isDataset(identifier)
    const githubDataset = parsedIdentifier.type === 'github' && parsedIdentifier.name.slice((parsedIdentifier.name.lastIndexOf('.') - 1 >>> 0) + 2) === ''

    if(parsedIdentifier.type === "datahub"){
      /**
      https://github.com/datahq/datahub-qa/issues/86
      For datasets from datahub we will get zipped version and unzip it.
        - less traffic
        - zipped version has a fancy file structure
      */

      // get zipped dataset archive
      const dataset = await Dataset.load(identifier)
      const zipped_dataset_resource = dataset.resources.filter(res => res.path.endsWith('.zip'))[0]
      const zipped_dataset_url = zipped_dataset_resource.path
      savedPath = path.join(dataset.identifier.owner || '', dataset.identifier.name)

      //await unzipFromUrl(zipped_dataset_url, savedPath)
      await saveFile(zipped_dataset_url, 'zip')

      // unzip archive

      //fs.createReadStream(archive_path).pipe(unzip.Extract({ path: savedPath }));

    // usual dataset loading
    } else if (itIsDataset || githubDataset) {
      const dataset = await Dataset.load(identifier)
      const isEmpty = checkDestIsEmpty(dataset.identifier.owner || '', dataset.identifier.name)
      if (isEmpty) {
        const allResources = await get(dataset)
        // Save all files on disk
        const myPromises = allResources.map(async resource => {
          return saveIt(dataset.identifier.owner || '', dataset.identifier.name, resource)
        })
        await Promise.all(myPromises)
        savedPath = path.join(dataset.identifier.owner || '', dataset.identifier.name)
      } else { // If dest is not empty then error
        throw new Error(`${dataset.identifier.owner}/${dataset.identifier.name} is not empty!`)
      }
      stopSpinner()
      const end = new Date() - start
      console.log(`Time elapsed: ${(end / 1000).toFixed(2)} s`)
      console.log(`Dataset/file is saved in "${savedPath}"`)
    // if not dataset - load file
    } else {
      if (parsedIdentifier.type === 'github' && !githubDataset) {
        identifier += `?raw=true`
      }
      const file = await File.load(identifier, {format: argv.format})
      const destPath = [file.descriptor.name, file.descriptor.format].join('.')
      const stream = await file.stream()
      stream.pipe(fs.createWriteStream(destPath)).on('finish', () => {
        stopSpinner()
        const end = new Date() - start
        console.log(`Time elapsed: ${(end / 1000).toFixed(2)} s`)
        console.log(`Dataset/file is saved in "${destPath}"`)
      })
    }
  } catch (err) {
    stopSpinner()
    handleError(err)
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    process.exit(1)
  }
}

run()

const saveFile = async (url, format) => {
  const file = await File.load(url, {format: format})
  const destPath = [file.descriptor.name, file.descriptor.format].join('.')
  const stream = await file.stream()
  stream.pipe(fs.createWriteStream(destPath)).on('finish', () => {
    console.log(`Dataset/file is saved in "${destPath}"`)
    return destPath
  })
}

const unzipFromUrl = async (url, destPath) => {
  const file = await File.load(url, {format: 'zip'})
  const stream = await file.stream()
  stream.pipe(unzip.Extract({ path: destPath })).on('finish', () => {
    console.log(`Dataset/file is saved in "${destPath}"`)
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
  if (!fs.existsSync(dest)) {
    return true
  }
  if (fs.readdirSync(dest).length === 0) {
    return true
  }
  return false
}

module.exports = {
  checkDestIsEmpty
}
