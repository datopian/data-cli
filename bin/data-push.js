#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { push } = require('../lib/push')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data push`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

    ${boldText(`$ data push`)}

  ${underline('Examples:')}

    ${chalk.gray('#')} Uploads Data Package to ${dhStyle('DataHub')} ${elephant}
    ${chalk.gray('#')} Data Package root directory should have datapackage.json
    ${boldText('$ data push')}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}


push()
