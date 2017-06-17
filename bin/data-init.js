#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { customMarked } = require('../lib/utils/tools.js')

// ours
const { init } = require('../lib/init')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['init'],
  boolean: ['help'],
  alias: {
    help: 'h'
  }
})

var initMarkdown = fs.readFileSync(path.join(__dirname, '../docs/init.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(initMarkdown))
}




if (argv.help) {
  help()
  process.exit(0)
}

init()
