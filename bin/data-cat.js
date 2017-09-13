#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const XLSX = require('xlsx')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const {File} = require('data.js')
const {dumpers} = require('../lib/cat')

const argv = minimist(process.argv.slice(2), {
  string: ['cat'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/cat.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

const pathParts = path.parse(argv._[0])

const outFileExt = argv._[1] ? path.extname(argv._[1]) : ''

const dumpIt = async (res) => {
  if (!argv._[1] || argv._[1] === 'stdout') {
    const out = await dumpers.ascii(res)
    console.log(out)
  } else if (outFileExt === '.csv') {
    const out = await dumpers.csv(res)
    fs.writeFileSync(argv._[1], out)
    console.log(`Your data is saved in ${argv._[1]}`)
  } else if (outFileExt === '.md') {
    const out = await dumpers.md(res)
    fs.writeFileSync(argv._[1], out)
    console.log(`Your data is saved in ${argv._[1]}`)
  } else if (outFileExt === '.xlsx') {
    const out = await dumpers.xlsx(res)
    const wb = {SheetNames: ['sheet'], Sheets: {sheet: out}}
    XLSX.writeFile(wb, argv._[1])
    console.log(`Your data is saved in ${argv._[1]}`)
  } else {
    console.log('We currently do not support this feature.')
  }
}

let pipedData = ''
if (pathParts.name === '_') {
  process.stdin.on('readable', () => {
    const chunk = process.stdin.read()
    if (chunk !== null) {
      pipedData += chunk
    }
   })

  process.stdin.on('end', () => {
    dumpIt(pipedData)
  })
} else {
  const res = File.load(argv._[0])
  dumpIt(res)
}
