#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { customMarked } = require('../lib/utils/tools.js')

// ours
const { get } = require('../lib/get')
const { box, elephant, square } = require('../lib/utils/logo')
const { spinner } = require('../lib/utils/tools')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['get'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/get.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

let dhpkgid = argv._[0]

const run = async () => {
  spinner.start()
  await get(dhpkgid)
  spinner.stop()
}

run()
