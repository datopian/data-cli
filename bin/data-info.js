#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

const data = require('../lib/utils/data.js')
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

const fileOrDatasetIdentifier = argv._[0]

Promise.resolve().then(async () => {
  const ispkg = isPackage(fileOrDatasetIdentifier)
  if (ispkg) {
    const pkg = await data.Package.load(fileOrDatasetIdentifier)
    const out = info.info(pkg)
    console.log(customMarked(out))
  } else {
    const resource = data.Resource.load(fileOrDatasetIdentifier)
    resource.info.pipe(process.stdout)
  }
})

// Is package or file
const isPackage = path_ => {
  if (path_.endsWith('datapackage.json')) {
    return true
  }
  if (data.isUrl(path_)) {
    return true
    // Path_.match(/.*\.[^.]+$/)
    // if lastPart(hasExtension) => guess file
  }
    // IsDirectory() => directory
  return true
}
