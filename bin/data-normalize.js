#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

// Ours
const {normalize} = require('../lib/normalize')

const argv = minimist(process.argv.slice(2), {
  string: ['normalize'],
  boolean: ['help'],
  alias: {
    help: 'h'
  }
})

const normalizeMarkdown = fs.readFileSync(path.join(__dirname, '../docs/normalize.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(normalizeMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

const pathForDp = argv._[0]

normalize(pathForDp)
