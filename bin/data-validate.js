#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')

// Ours
const {validate} = require('../lib/validate')
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

const descriptor = argv._[0]

validate(descriptor).then(validation => {
  if (Array.isArray(validation)) {
    error(validation)
    process.exit(1)
  }
  console.log('Data Package is valid')
})
