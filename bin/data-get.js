#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { get } = require('../lib/get')
const { box, elephant, square } = require('../lib/utils/logo')

const argv = minimist(process.argv.slice(2), {
  string: ['get'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${chalk.bold(`data get`)}

  ${chalk.dim('Options:')}
    -h, --help              Output usage information

  ${chalk.dim('Usage:')}
  ${chalk.bold(`data get <dhpkgid>`)}

  ${chalk.dim('Examples:')}
  ${chalk.gray('–')} Downolads the Data Package from Datahub ${elephant}
    Saves to relative subdirectory {publisher}/{package}
    ${chalk.cyan('$ data get publisher/package')}
`)
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

let dhpkgid = argv._[0]

get(dhpkgid)
