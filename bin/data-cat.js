#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const chalk = require('chalk')
const XLSX = require('xlsx')

// ours
const { customMarked } = require('../lib/utils/tools.js')
const { Resource } = require('../lib/utils/data.js')
const { dumpers } = require('../lib/cat')

const argv = minimist(process.argv.slice(2), {
  string: ['cat'],
  boolean: ['help'],
  alias: { help: 'h' }
})

let getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/cat.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

let res = Resource.load(argv._[0]),
  outFileExt
if (argv._[1]) {
  outFileExt = path.extname(argv._[1])
}

(async () => {
  if (!argv._[1] || argv._[1] === 'stdout') {
    const out = await dumpers['ascii'](res)
    console.log(out)
  } else if (outFileExt === '.csv') {
    const out = await dumpers['csv'](res)
    fs.writeFileSync(argv._[1], out)
    console.log(`Your data is saved in ${argv._[1]}`)
  } else if (outFileExt === '.md') {
    const out = await dumpers['md'](res)
    console.log(`Your data is saved in ${argv._[1]}`)
    fs.writeFileSync(argv._[1], out)
  } else if (outFileExt === '.xls') {
    const out = await dumpers['xls'](res)
    const wb = { SheetNames:['sheet'], Sheets:{sheet: out} };
    console.log(`Your data is saved in ${argv._[1]}`)
    XLSX.writeFile(wb, argv._[1])
  }
  else {
    console.log('We currently do not support this feature.')
  }
})()
