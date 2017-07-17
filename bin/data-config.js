#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')

// Ours
const {customMarked} = require('../lib/utils/tools.js')

const argv = minimist(process.argv.slice(2), {
  string: ['config'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const configMarkdown = fs.readFileSync(path.join(__dirname, '../docs/config.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(configMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}
