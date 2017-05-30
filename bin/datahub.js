#!/usr/bin/env node --harmony
const config = require('../lib/config.js')
const client = require('../lib/index.js')
const program = require('commander')
const version = require('../package.json').version

program
  .version(version)
  .usage('<command> [options] ')

program
  .command('get <package> [dest]')
  .description('View or Download file from DataHub')
  .action(function(package, dest) {
    [ publisher, package, resource ] = package.split('/')
    client.get(publisher, package, resource, dest)
  })

program
  .command('push [package]')
  .description('Publish on DataHub server')
  .action(function(package) {
    let conf = config.readConfig()
    client.push(conf)
  })

program
  .command('configure [dest]')
  .description('Set Up DataHub Configurations')
  .action(function(dest) {
    config.configure(config.configFile)
  })

program
  .command('help')
  .description('Show help')
  .action(function(dest) {
    program.outputHelp()
  })

program.parse(process.argv)

// Check the program.args obj
var NO_COMMAND_SPECIFIED = program.args.length === 0

// Handle it however you like
if (NO_COMMAND_SPECIFIED) {
  // e.g. display usage
  console.log('\n  Welcome to the DataHub command line tool.')
  console.log('\n  DataHub = 📦  + 🐘  A home for all your data, nicely packaged ❒ ')
  console.log('\n  We hope this tool will bring you much joy as you work with your data and the DataHub.')
  console.log('\n  ---')
  program.outputHelp()
}

