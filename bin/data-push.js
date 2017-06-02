#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { push } = require('../lib/push')
const { box, elephant, square } = require('../lib/utils/logo')

const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${chalk.bold(`data push`)}

  ${chalk.dim('Options:')}
    -h, --help              Output usage information

  ${chalk.dim('Usage:')}
  ${chalk.bold(`data push`)}

  ${chalk.dim('Examples:')}
  ${chalk.gray('–')} Uploads Data Package to DataHub ${elephant}
    From Data Package root directory (should have datapackage.json)
    ${chalk.cyan('$ data push')}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}


push()
