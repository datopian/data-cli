#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const chalk = require('chalk')
const toArray = require('stream-to-array')
const Table = require('cli-table')

const { customMarked } = require('../lib/utils/tools.js')
const { Resource } = require('../lib/utils/data.js')

// ours
const { cat } = require('../lib/cat')

const argv = minimist(process.argv.slice(2), {
  string: ['cat'],
  boolean: ['help'],
  alias: { help: 'h' }
})

var getMarkdown = fs.readFileSync(path.join(__dirname, '../docs/cat.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(getMarkdown))
}

if (argv.help || !argv._[0]) {
  help()
  process.exit(0)
}

var res = Resource.load(argv._[0])

Promise.resolve().then(async () => {
	const rows = await toArray(await res.rows)

  // process.stdout.columns not defined when piping so we assume 100
  const termwidth = process.stdout.columns || 100
  const numrows = rows[0].length
  // algorithm: termwidth - (1 each for each column edge + 1 extra)
  var eachColWidth = Math.floor(Math.max(5, (termwidth - numrows -1) / numrows))
  var colWidths = Array(numrows).fill(eachColWidth)

	let table = new Table({
			head: rows[0]
		, colWidths: colWidths
	})

  rows.slice(1).forEach(row => {
    table.push(row)
  })

	console.log(table.toString());
})
