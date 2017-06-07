#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

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

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data purge`)} command

  ${underline('Options:')}

    ${boldText('-f, --force')}             ${italic('Force purge (delete without dialogue)')}
    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

    ${chalk.gray('#')} Permanently deletes Data Package from ${dhStyle('DataHub')} ${elephant}
    ${chalk.gray('#')} Run from package root directory (datapackage.json should present)
    ${boldText(`$ data purge`)}

  ${underline('Examples:')}

    ${boldText('$ data purge')}
    > Package Name:  finance-vix

    ${boldText('$ data purge -f')}
    ${boldText('$ data purge --force')}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}

purge(argv.force)
