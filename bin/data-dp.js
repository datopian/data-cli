#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs');

// ours
const { normalizeAll } = require('../lib/normalize')
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


const writeDatapackage = (dp) => {
  fs.writeFile(path, JSON.stringify(dp, null, 2),  (err) => {
    if (err) {
        console.error(err);
        return;
    };
    console.log("Datapackage.json has been normalized");
  });
}

const readDatapackage = (path) => {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

let path = process.argv[3]

if(argv._[0] === 'normalize' || argv._[0] === 'norm') {
  
  if(!path){
    path = './datapackage.json'
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else if(fs.lstatSync(path).isFile()) {
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else if(path.slice(0,-1) != '/'){
    path += '/datapackage.json';
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else {
    path += 'datapackage.json';
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
} 
else {
  help()
  process.exit(0)
}


