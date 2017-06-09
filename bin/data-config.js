#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { config, configFile } = require('../lib/config')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['config'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data config`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

  ${boldText(`$ data config`)}
  ${boldText(`$ data configure`)}

  ${underline('Examples:')}

    ${chalk.gray('#')} Sets Up Configurations for ${dhStyle('DataHub')} ${elephant}
    ${chalk.gray('#')} config file is saved in ~/.datahub/config
    ${boldText('$ data cofig')}

  ${boldText('> Username: DataGeek')}
  ${boldText('> Your secret token (input hidden): Y0uR53cr3tt0KeN')}
  ${boldText('> Server URL: http://datapackaged.com/')}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}

config(configFile)
