#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {init} = require('datahub-client').init

// Ours
const {customMarked} = require('../lib/utils/tools.js')

const argv = minimist(process.argv.slice(2), {
  string: ['init'],
  boolean: ['help'],
  alias: {
    help: 'h'
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

init()
