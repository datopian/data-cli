#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { config, configFile } = require('../lib/config')
const { box, elephant, square } = require('../lib/utils/logo')

const argv = minimist(process.argv.slice(2), {
  string: ['config'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${chalk.bold(`data config`)}

  ${chalk.dim('Options:')}
    -h, --help              Output usage information

  ${chalk.dim('Usage:')}
  ${chalk.bold(`data config`)}
  ${chalk.bold(`data configure`)}

  ${chalk.dim('Examples:')}
  ${chalk.gray('–')} Sets Up Configurations for DataHub ${elephant}
    config file is saved in ~/.datahub/config
    ${chalk.cyan('$ data cofig')}

  ${chalk.cyan('> Username: DataGeek')}
  ${chalk.cyan('> Your secret token (input hidden): Y0uR53cr3tt0KeN')}
  ${chalk.cyan('> Server URL: http://datapackaged.com/')}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}

config(configFile)
