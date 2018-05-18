#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const data = require('data.js')
const {info, Agent} = require('datahub-client')

const {customMarked} = require('../lib/utils/tools.js')
const {handleError} = require('../lib/utils/error')
const printInfo = require('../lib/utils/output/info')

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
  // If given path is a URL then fetch headers and check if status is OK:
  const agent = new Agent(fileOrDatasetIdentifier, {debug: argv.debug})
  if (data.isUrl(fileOrDatasetIdentifier)) {
    const response = await agent.fetch('/')
    if (response.status >= 400) {
      throw new Error(`Provided URL returns ${response.status} status code.`)
    }
  }

  try {
    const parsedIdentifier = await data.parseDatasetIdentifier(fileOrDatasetIdentifier)
    const isdataset = data.isDataset(fileOrDatasetIdentifier)
    const githubDataset = parsedIdentifier.type === 'github' && parsedIdentifier.name.slice((parsedIdentifier.name.lastIndexOf('.') - 1 >>> 0) + 2) === ''
    if (isdataset || parsedIdentifier.type === "datahub" || githubDataset) {
      const dataset = await data.Dataset.load(fileOrDatasetIdentifier)
      const out = info.infoPackage(dataset)
      console.log(customMarked(out))
    } else {
      const file = data.File.load(fileOrDatasetIdentifier, {format: argv.format})
      const knownTabularFormats = ['csv', 'tsv', 'dsv']
      if (knownTabularFormats.includes(file.descriptor.format)) {
        await file.addSchema()
      }
      // Only print table if resource is tabular:
      let table
      let tabularFormatsAndExcel = knownTabularFormats.concat(['xls', 'xlsx'])
      if (tabularFormatsAndExcel.includes(file.descriptor.format)) {
        table = await info.infoResource(file)
      }
      console.log(customMarked('**File descriptor:**'))
      console.log(JSON.stringify(file.descriptor, null, 2))
      if (table) {
        console.log(table)
        console.log(customMarked('*Only showing first 10 lines. There might be more data.*'))
      }
    }
  } catch (err) {
    if (!argv._[0]) {
      printInfo('Running `data info` without an argument will search a `datapackage.json` file in the current working directory.')
    }
    await handleError(err)
    process.exit(1)
  }
  agent.close()
})
