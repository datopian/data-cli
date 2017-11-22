#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')

// Ours
const {customMarked} = require('datahub')
const {File} = require('data.js')
const {writers} = require('datahub').cat
const {infoOutput} = require('datahub')

const argv = minimist(process.argv.slice(2), {
  string: ['cat'],
  boolean: ['help'],
  alias: {help: 'h'}
})

const getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/cat.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(getMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

const pathParts = argv._[0] ? path.parse(argv._[0]) : {name: null}

let outFileExt, outFormat
if (argv._[1] && argv._[1] !== 'stdout') {
  outFileExt = path.extname(argv._[1]) || '.noext'
  outFormat = outFileExt.slice(1)
} else {
  outFormat = 'ascii'
}

const writersDatabase = {
  ascii: writers.ascii,
  csv: writers.csv,
  xlsx: writers.xlsx,
  md: writers.md,
  html: writers.html
}

const dumpIt = async (res) => {
  let stream
  if (outFormat in writersDatabase) {
    stream = await writersDatabase[outFormat](res)
    if (outFormat === 'ascii') { // Write to stdout
      stream.pipe(process.stdout)
    } else { // Write to file
      const writeStream = fs.createWriteStream(argv._[1], {flags : 'w'})
      stream.pipe(writeStream)
      writeStream.on('close', () => {
        infoOutput(`All done! Your data is saved in "${argv._[1]}"`)
      })
    }
  } else {
    infoOutput(`Sorry, provided output format is not supported.`)
  }
}

if (pathParts.name === '_' || (!pathParts.name && process.stdin.constructor.name === 'Socket')) {
  // TODO: atm, it is just passing stdin to stout. Fix it to process stdin to available writers.
  process.stdin.pipe(process.stdout)
} else if (pathParts.name) {
  const res = File.load(argv._[0], {format: argv.format})
  dumpIt(res)
} else {
  infoOutput('No input is provided. Please, run "data cat --help" for usage information.')
}
