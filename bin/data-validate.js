#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const jsonlint = require('jsonlint')
const {validate} = require('datahub-client').validate
const {Dataset} = require('data.js')

// increase MaxListenersExceededWarning level for cases when the remote dataset has a lot of resources,
// to avoid: Warning: Possible EventEmitter memory leak detected. X end listeners added.
// ~11 requests is required to validate remote 1 tabular resource, so I set a limit to match a dataset with 10 files.
require('events').EventEmitter.defaultMaxListeners = 120;

// Ours
const {customMarked} = require('../lib/utils/tools')
const {error} = require('../lib/utils/error')

const argv = minimist(process.argv.slice(2), {
  string: ['validate'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const validateMarkdown = fs.readFileSync(path.join(__dirname, '../docs/validate.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(validateMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

let path_ = argv._[0]

if (!path_) {
  path_ = process.cwd()
}

Dataset.load(path_).then(dataset => {
  // Validate
  validate(dataset).then(result => {
    if (result === true) {
      console.log('Your Data Package is valid!')
    } else {
      // console.log(JSON.stringify(result))
      // result is a TableSchemaError with attributes: message, rowNumber, and errors
      // each error in errors is of form { message, rowNumber, columnNumber }

      // HACK: strip out confusing "(see 'error.errors')" in error message
      if (result.message) {
        const msg = result.message.replace(" (see 'error.errors')", '') + ' on line ' + result.rowNumber
        error(msg)
        result.errors.forEach(err => {
          error(err.message)
        })
      }
      else {
        error(result)
      }
    }
  }).catch(err => {
    error(err.message)
    if (err.resource) {
      error(`Resource: ${err.resource}`)
      error(`Path: ${err.path}`)
    }
  })
}).catch(err => { // If 'Dataset.load' throws error then let's try to identify what's wrong with descriptor:
  error(err.message)
  // Get path to datapackage.json
  if (fs.lstatSync(path_).isDirectory()) {
    // Check datapackage.json in this dir and if doesn't exist then throw error:
    path_ = path.join(path_, 'datapackage.json')
    if (!fs.existsSync(path_)) {
      error('datapackage.json not found in the given directory')
    }
  }
  // Read given path
  let content
  try {
    content = fs.readFileSync(path_)
  } catch (err) {
    error(err.message)
    process.exit(1)
  }

  var lint = jsonlint.parse(content.toString())
  if (lint.error) {
    error(`Invalid JSON: on line ${lint.line}, character ${lint.character}\n\n  ${lint.error}\n\n${lint.evidence}`)
    process.exit(1)
  }
})
