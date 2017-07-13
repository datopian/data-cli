#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const chalk = require('chalk')
const { customMarked } = require('../lib/utils/tools.js')

const data = require('../lib/utils/data.js')
const info = require('../lib/info')


const argv = minimist(process.argv.slice(2), {
  string: ['info'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var infoMarkdown = fs.readFileSync(path.join(__dirname, '../docs/info.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(infoMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

let fileOrDatasetIdentifier = argv._[0]


Promise.resolve().then(async () => {
  const ispkg = isPackage(fileOrDatasetIdentifier)
  if (ispkg) {
    const pkg = await data.Package.load(fileOrDatasetIdentifier)
    const out = info.info(pkg)
    console.log(customMarked(out))
  } else {
    const resource = data.Resource.load(fileOrDatasetIdentifier)
    resouce.info.pipe(process.stdout)
  }
})

// is package or file
const isPackage = (path_) => {
  if (path_.endsWith('datapackage.json')) {
    return true
  }
  if (data.isUrl(path_)) {
    return true
    // path_.match(/.*\.[^.]+$/)
    // if lastPart(hasExtension) => guess file
  } else {
    // isDirectory() => directory
    return true
  }
}
