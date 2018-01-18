#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const jsonlint = require('json-lint')
const {validate} = require('datahub-client').validate

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

// Get path to datapackage.json
if (fs.lstatSync(path_).isDirectory()) {
  // Read datapackage.json in this dir
  path_ = path.join(path_, 'datapackage.json')
} else if (path.basename(path_) !== 'datapackage.json') {
  // Check if there is a datapackage.json in cwd, if not throw an error
  const dpJsonPath = path.join(process.cwd(), 'datapackage.json')
  if (fs.existsSync(dpJsonPath)) {
    path_ = dpJsonPath
  } else {
    error('datapackage.json not found in cwd')
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

var lint = jsonlint(content.toString())
if (lint.error) {
  error(`Invalid JSON: on line ${lint.line}, character ${lint.character}\n\n  ${lint.error}\n\n${lint.evidence}`)
  process.exit(1)
}

// Get JS object from file content
const descriptor = JSON.parse(content)

// Validate
try {
  validate(descriptor, path.dirname(path_)).then(result => {
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
  })
} catch (err) {
  error(err.message)
}
