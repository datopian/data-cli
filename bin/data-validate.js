#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')

// ours
const { validate } = require('../lib/validate')
const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

const argv = minimist(process.argv.slice(2), {
  string: ['validate'],
  boolean: ['help'],
  alias: { help: 'h' }
})

const help = () => {
  console.log(`
  ${elephant} ${boldText(` data validate`)} command

  ${underline('Options:')}

    ${boldText('-h, --help')}              ${italic('Output usage information')}

  ${underline('Usage:')}

    ${chalk.gray('#')} Validate datapackage.json in given path/URL or in cwd if not given:
    ${boldText(`$ data validate [path | URL]`)}

  ${underline('Example:')}

    ${chalk.gray('#')} Validate descriptor in current working directory:
    ${boldText(`$ data validate`)}

    ${chalk.gray('#')} Validate descriptor in local path:
    ${boldText(`$ data validate test/fixtures/datapackage.json`)}

    ${chalk.gray('#')} Validate descriptor in URL:
    ${boldText(`$ data validate https://bits-staging.datapackaged.com/metadata/core/gdp/_v/latest/datapackage.json`)}
`)
}

if (argv.help) {
  help()
  process.exit(0)
}

let descriptor = argv._[0]

validate(descriptor)
