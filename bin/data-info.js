#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

const data = require('data.js')
const info = require('../lib/info')

const argv = minimist(process.argv.slice(2), {
  string: ['info'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const infoMarkdown = fs.readFileSync(path.join(__dirname, '../docs/info.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(infoMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

const fileOrDatasetIdentifier = argv._[0] ? argv._[0] : './'

Promise.resolve().then(async () => {
  const isdataset = data.isDataset(fileOrDatasetIdentifier)
  if (isdataset) {
    const dataset = await data.Dataset.load(fileOrDatasetIdentifier)
    const out = info.infoPackage(dataset)
    console.log(customMarked(out))
  } else {
    const file = data.File.load(fileOrDatasetIdentifier)
    const out = await info.infoResource(file)
    console.log(out)
  }
})
