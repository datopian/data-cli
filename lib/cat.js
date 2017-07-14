const toArray = require('stream-to-array')
const Table = require('cli-table')
const mdTable = require('markdown-table')
const CSV = require('csv-string')
const XLSX = require('xlsx')


export const dumpAscii = async function(resource) {
  const rows = await toArray(await resource.rows)

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

	return table.toString()
}


export const dumpCsv = async function(resource) {
  const rows = await toArray(await resource.rows)
  return CSV.stringify(rows)
}


export const dumpMarkdown = async function(resource) {
  const rows = await toArray(await resource.rows)
  return mdTable(rows)
}

export const dumpXls = async function(resource) {
  const rows = await toArray(await resource.rows)
  return XLSX.utils.aoa_to_sheet(rows)
}


export const dumpers = {
  ascii: dumpAscii,
  csv: dumpCsv,
  md: dumpMarkdown,
  xls: dumpXls
}
