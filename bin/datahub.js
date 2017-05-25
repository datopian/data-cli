#!/usr/bin/env node
const configure = require('../lib/config.js').configure
const get = require('../lib/index.js').get
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
    get(publisher, package, resource, dest)
  })

program
  .command('configure [dest]')
  .description('Set Up DataHub Configurations')
  .action(function(dest) {
    configure()
  })

program.parse(process.argv)
