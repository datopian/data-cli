#!/usr/bin/env node

const minimist = require('minimist')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { customMarked } = require('../lib/utils/tools.js')

const { login, logout } = require('../lib/login')


const argv = minimist(process.argv.slice(2), {
  string: ['login'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var configMarkdown = fs.readFileSync(path.join(__dirname, '../docs/login.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(configMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

login()

