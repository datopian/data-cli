#!/usr/bin/env node

// Packages
const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

// Ours
const {get} = require('../lib/get')
const wait = require('../lib/utils/output/wait')

const argv = minimist(process.argv.slice(2), {
  string: ['get'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/get.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

const identifier = argv._[0]

const run = async () => {
  const stopSpinner = wait('Loading...')
  await get(identifier)
  stopSpinner()
}

run()
