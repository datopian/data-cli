#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { customMarked } = require('../lib/utils/tools.js')
const { Resource } = require('../lib/utils/data.js')
const { dumpers } = require('../lib/cat')

const argv = minimist(process.argv.slice(2), {
  string: ['cat'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/cat.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

var res = Resource.load(argv._[0])

if (!argv._[1] || argv._[1] === 'stdout') {
  dumpers['ascii'](res)
} else {
  console.log('We currently do not support this feature.')
}
