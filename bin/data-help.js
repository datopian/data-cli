const chalk = require('chalk')

const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

console.log(`
  ${boldText(`Welcome to the ${dhStyle('DataHub')} command line tool.`)}

  ${dhStyle('DataHub')} = ${box}  + ${elephant}  A home for all your data, nicely packaged ${square}

  We hope this tool will bring you much joy as you work with your data and the ${dhStyle('DataHub')}.

  ---

  ${boldText('Usage:')} $ data <command> [options]

  ${underline('Commands:')}

    ${boldText('get')}      <dhpkgid>    ${italic('View or Download file from DataHub')}
    ${boldText('push')}                  ${italic('Publish on DataHub server')}
    ${boldText('config')}                ${italic('Set Up DataHub Configurations')}
    ${boldText('help ')}                 ${italic('Show help')}

  ${underline('Options:')}

    ${boldText('-h,  --help')}           ${italic('output usage information')}
    ${boldText('-v,  --version')}        ${italic('output the version number')}
`)
