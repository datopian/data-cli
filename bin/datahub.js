#!/usr/bin/env node --harmony
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

program.parse(process.argv)
