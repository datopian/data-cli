#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs')
const {customMarked} = require('../lib/utils/tools.js')

// ours
const { purge } = require('../lib/purge')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['purge'],
  boolean: ['help', 'force'],
  alias: { help: 'h', force: 'f' }
})

var purgeMarkdown = fs.readFileSync('docs/purge.md','utf8')
const help = () => {
  console.log('\n'+ customMarked(purgeMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

purge(argv.force)
