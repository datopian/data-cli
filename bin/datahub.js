#!/usr/bin/env node --harmony
const config = require('../lib/config.js')
const get = require('../lib/index.js').get
const program = require('commander')
const version = require('../package.json').version

program
  .version(version)
  .usage('<command> [options] ')
  .option('-c, --config <path>', 'Use custom config file', config.configFile)

program
  .command('get <package> [dest]')
  .description('View or Download file from DataHub')
  .action(function(package, dest) {
    [ publisher, package, resource ] = package.split('/')
    get(publisher, package, resource, dest)
  })

program
  .command('configure [dest]')
  .description('Set Up DataHub Configurations')
  .action(function(dest) {
    config.configure(program.config)
  })

program.parse(process.argv)
