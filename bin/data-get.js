#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

// Ours
const {Dataset, File, isDataset} = require('data.js')
const {get} = require('../lib/get')
const wait = require('../lib/utils/output/wait')
const {handleError} = require('../lib/utils/error')

const argv = minimist(process.argv.slice(2), {
  string: ['get'],
  boolean: ['help'],
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

const identifier = argv._[0]

const run = async () => {
  const stopSpinner = wait('Loading...')
  const start = new Date()
  let savedPath
  const itIsDataset = isDataset(identifier)
  if (itIsDataset) {
    const dataset = await Dataset.load(identifier)
    const isEmpty = checkDestIsEmpty(dataset.identifier.owner || '', dataset.identifier.name)
    if (isEmpty) {
      try {
        const allResources = await get(dataset)
        // Save all files on disk
        allResources.forEach(async resource => {
          await saveIt(dataset.identifier.owner || '', dataset.identifier.name, resource)
        })
        savedPath = path.join(dataset.identifier.owner || '', dataset.identifier.name)
      } catch (err) {
        stopSpinner()
        handleError(err)
        if (argv.debug) {
          console.log('> [debug]\n' + err.stack)
        }
        process.exit(1)
      }
    } else { // If dest is not empty then error
      throw new Error(`${dataset.identifier.owner}/${dataset.identifier.name} is not empty!`)
    }
  } else {
    const file = await File.load(identifier)
    const destPath = [file.descriptor.name, file.descriptor.format].join('.')
    const stream = await file.stream()
    stream.pipe(fs.createWriteStream(destPath))
    savedPath = destPath
  }
  stopSpinner()
  const end = new Date() - start
  console.log(`Time elapsed: ${(end / 1000).toFixed(2)} s`)
  console.log(`Dataset/file is saved in "${savedPath}"`)
}

run()

const saveIt = async (owner, name, resource) => {
  // We only can save if path is defined
  if (resource.descriptor.path) {
    const destPath = path.join(owner, name, resource.descriptor.path)
    mkdirp.sync(path.dirname(destPath))
    const stream = await resource.stream()
    stream.pipe(fs.createWriteStream(destPath))
  }
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
