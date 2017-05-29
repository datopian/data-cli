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

program.parse(process.argv)
