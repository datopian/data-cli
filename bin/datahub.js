#!/usr/bin/env node --harmony
const get = require('../lib/index.js').get
const program = require('commander')
const version = require('../package.json').version

program
  .version(version)
  .usage('<command> [options] ')
  .description('DataHub CLI')
  .command('get <package> [dest...]', 'View or Download file from Datahub')
  .action(function(package, dest) {
    [ publisher, package, resource ] = package.split('/')
    get(publisher, package, resource, dest)
  })

program.parse(process.argv)
