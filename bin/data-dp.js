#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs');


// ours
const { normalize } = require('../lib/normalize')

//const writeDatapackage = require('../lib/normalize.js').writeDatapackage
const { box, elephant, square } = require('../lib/utils/logo')

const argv = minimist(process.argv.slice(2), {
  string: ['normalize'],
  boolean: ['help'],
  alias: { 
    help: 'h',
    normalize: 'norm'
  }
})
const help = () => {
  console.log(`
  ${chalk.bold(`data dp [argument]`)}

  ${chalk.dim('Arguments:')}
    normalize               Normalizes datapackage.json      
  
  ${chalk.dim('Options:')}
    -h, --help              Output usage information
  
  ${chalk.dim('Usage:')}
  ${chalk.bold(`data dp normalize`)}

  ${chalk.dim('Examples:')}
  ${chalk.gray('–')} Normalizes the datapackage.json from current directory ${elephant}
    Returns normalized datapackage.json
    ${chalk.cyan('$ data dp normalize')}
`)
}
if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}


let path = process.argv[3]
let command = argv._[0]

if(command === 'normalize' || command === 'norm') {
  normalize(path)
}else{
  help()
  process.exit(0)
}