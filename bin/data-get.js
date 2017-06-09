#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

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

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data get`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

    ${boldText(`$ data get <dhpkgid>`)}

  ${underline('Examples:')}

    ${chalk.gray('#')} Downolads the Data Package from ${dhStyle('DataHub')} ${elephant}
    ${chalk.gray('#')} Saves to relative subdirectory {publisher}/{package}
    ${boldText('$ data get publisher/package')}
`)
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
