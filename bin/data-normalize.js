#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs');

// ours
const { normalize } = require('../lib/normalize')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['normalize'],
  boolean: ['help'],
  alias: {
    help: 'h'
  }
})
const help = () => {
  console.log(`
  ${elephant} ${boldText(` data norm[alize] [path]`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}


  ${underline('Usage:')}

    ${chalk.gray('#')} Normalize datapackage.json:
    ${boldText(`$ data norm [path]`)}
    ${boldText(`$ data normalize [path]`)}

  ${underline('Example:')}

    ${chalk.gray('#')} Normalize descriptor in current working directory:
    ${boldText(`$ data normalize`)}

    ${chalk.gray('#')} Normalize descriptor with local path to datapackage.json:
    ${boldText(`$ data normalize core/finance-vix/datapackage.json`)}

    ${chalk.gray('#')} Normalize descriptor with path to Data Package:
    ${boldText(`$ data normalize core/finance-vix`)}
`)
}
if (argv.help) {
  help()
  process.exit(0)
}

let path = argv._[0]

normalize(path)

