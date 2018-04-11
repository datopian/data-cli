#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const jsonlint = require('jsonlint')
const {Validator} = require('datahub-client')
const {Dataset} = require('data.js')
const {eraseLines} = require('ansi-escapes')

// Ours
const {customMarked} = require('../lib/utils/tools')
const {error} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const info = require('../lib/utils/output/info')

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

const validator = new Validator({identifier: path_})
const stopSpinner = wait('')

validator.on('message', (message) => {
  if (message.constructor.name === 'String') {
    process.stdout.write(eraseLines(1))
    info(message)
  } else {
    process.stdout.write(eraseLines(2))
    info(message.name + ': ' + message.status)
  }
})

validator.validate().then(result => {
  if (result === true) {
    stopSpinner()
    process.stdout.write(eraseLines(2))
    info('Your Data Package is valid!')
  } else {
    stopSpinner()
    process.stdout.write(eraseLines(2))
    // result is a TableSchemaError with attributes: message, rowNumber, and errors
    // each error in errors is of form { message, rowNumber, columnNumber }

    // HACK: strip out confusing "(see 'error.errors')" in error message
    if (result.message) {
      error(`Validation has failed for "${result.resource}"`)
      const msg = result.message.replace(" (see 'error.errors')", '') + ' on line ' + result.rowNumber
      error(msg)
      result.errors.forEach(err => {
        error(err.message)
      })
    }
    else {
      if (result.constructor.name === 'Array') {
        result.forEach(err => error(err.message))
      } else {
        error(result)
      }
    }
  }
}).catch(err => {
  stopSpinner()
  process.stdout.write(eraseLines(2))
  error(err.message)
  if (err.resource) {
    error(`Resource: ${err.resource}`)
    error(`Path: ${err.path}`)
  }
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
