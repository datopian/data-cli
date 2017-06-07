// const chalk = require('chalk')

const { box, elephant, square } = require('../lib/utils/logo')

console.log(`
  Welcome to the DataHub command line tool.

  DataHub = ${box}  + ${elephant}  A home for all your data, nicely packaged ${square}

  We hope this tool will bring you much joy as you work with your data and the DataHub.

  ---

  Usage: data <command> [options]

  Commands:

    get      <package>    View or Download file from DataHub
    push                  Publish on DataHub server
    dp normalize          Normalize datapackage.json
    config                Set Up DataHub Configurations
    help                  Show help
  Options:

    -h,  --help           output usage information
    -v,  --version        output the version number
`)
