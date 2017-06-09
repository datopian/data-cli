#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { getInfo } = require('../lib/info')
const { box, elephant, square } = require('../lib/utils/logo')
const { spinner } = require('../lib/utils/tools')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['info'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data info`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

    ${chalk.gray('#')} Get Data Package info for given publisher and package:
    ${boldText(`$ data info <publisher>/<package>`)}

  ${underline('Example:')}

    ${chalk.gray('#')} Get Data Package info for given core publisher and co2-ppm package:
    ${boldText(`$ data info core/gdp`)}
  `)
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

let dhpkgid = argv._[0]


const run = async () => {
  spinner.start()
  await getInfo(dhpkgid)
  spinner.stop()
}

run()
