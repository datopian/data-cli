#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const {File, isUrl} = require('data.js')
const {writers} = require('datahub-client').cat

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const info = require('../lib/utils/output/info.js')
const {handleError, error} = require('../lib/utils/error')

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

const dumpIt = async (res, {sheet}={}) => {
  let stream
  if (outFormat in writersDatabase) {
    try {
      stream = await writersDatabase[outFormat](res, {sheet})
    } catch (err) {
      if (isUrl(argv._[0])) {
        error('Provided URL is invalid')
      }
      await handleError(err)
      process.exit(1)
    }

    if (outFormat === 'ascii') { // Write to stdout
      stream.pipe(process.stdout)
    } else { // Write to file
      const writeStream = fs.createWriteStream(argv._[1], {flags : 'w'})
      stream.pipe(writeStream)
      writeStream.on('close', () => {
        info(`All done! Your data is saved in "${argv._[1]}"`)
      })
    }
  } else {
    info(`Sorry, provided output format is not supported.`)
  }
}

if (pathParts.name === '_' || (!pathParts.name && process.stdin.constructor.name === 'Socket')) {
  dumpIt(process.stdin)
} else if (pathParts.name) {
  // Check both 'sheet' and 'sheets' args as users can use both of them:
  let sheet = argv.sheet || argv.sheets
  // Check if it can be coerced to integer, if so we assume it's sheet index:
  sheet = !!parseInt(sheet) ? parseInt(sheet) - 1 : sheet
  const res = File.load(argv._[0], {format: argv.format})
  dumpIt(res, {sheet})
} else {
  info('No input is provided. Please, run "data cat --help" for usage information.')
}
