#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

// ours
const { validate } = require('../lib/validate')
const { box, elephant, square } = require('../lib/utils/logo')
const { customMarked } = require('../lib/utils/tools')
const { logger } = require('../lib/utils/log-handler')


const argv = minimist(process.argv.slice(2), {
  string: ['validate'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var validateMarkdown = fs.readFileSync(path.join(__dirname, '../docs/validate.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(validateMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

let descriptor = argv._[0]

validate(descriptor).then(validation => {
  if(validation instanceof Array) {
    logger(validation, 'error', true)
  }
  logger('Data Package is valid', 'success')
})
