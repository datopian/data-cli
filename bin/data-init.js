#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {Init} = require('datahub-client')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const info = require('../lib/utils/output/info.js')

const argv = minimist(process.argv.slice(2), {
  string: ['init'],
  boolean: ['help', 'interactive'],
  alias: {
    help: 'h',
    interactive: 'i'
  }
})

const initMarkdown = fs.readFileSync(path.join(__dirname, '../docs/init.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(initMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}


const checkDpIsThere = (path_ = process.cwd()) => {
  const files = fs.readdirSync(path_)
  return files.indexOf('datapackage.json') > -1
}


(async() => {

  const initializer = new Init({interactive: argv.interactive, path_: argv._[0]})
  // Listen for events:
  initializer
    .on('message', (message) => {
      info(message)
    })
    .on('exit', (message) => {
      info(message)
      process.exit(0)
    })

  // Get a descriptor generated:
  let descriptor = {}
  if (checkDpIsThere(argv._[0])) {
    descriptor = await initializer.updateDataset()
  } else {
    descriptor = await initializer.createDataset()
  }
  // Now save the generated descriptor:
  const content = JSON.stringify(descriptor, null, 2)
  const dest = path.join(argv._[0] || '', 'datapackage.json')
  fs.writeFile(dest, content, 'utf8', err => {
    if (err) {
      throw new Error(err)
    } else {
      info(`\n💾 Descriptor is saved in "${dest}"`)
    }
  })

})()
