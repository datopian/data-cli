#!/usr/bin/env node

// Packages
const minimist = require('minimist')
const fs = require('fs')
const path = require('path')
const {customMarked} = require('../lib/utils/tools.js')
// ours
const { push } = require('../lib/push')

const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var pushMarkdown = fs.readFileSync(path.join(__dirname, '../docs/push.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(pushMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

const filePath = argv._[0]

push(filePath)
