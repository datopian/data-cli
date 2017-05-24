#!/usr/bin/env node --harmony

const program = require('commander')
const get = require('../lib/index.js').get

console.log('Welcome to Datahub!')

program
  .arguments('<command>')
  .action(function(command) {
    if(command === 'get') {
      get()
    }
  })
  .parse(process.argv)
