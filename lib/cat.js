const toArray = require('stream-to-array')
const Table = require('cli-table')
const mdTable = require('markdown-table')
const CSV = require('csv-string')
const XLSX = require('xlsx')

const getRows = async (input) => {
  let rows
  if (input.constructor.name.includes('File')) { // checking if it is an instance of File class
    rows = await toArray(await input.rows())
  } else { // if not we assume it is a CSV coming from stdin
    rows = CSV.parse(input)
  }
  return rows
}

const dumpAscii = async function (resource) {
  const rows = await getRows(resource)

  // Process.stdout.columns not defined when piping so we assume 100
  const termwidth = process.stdout.columns || 100
  const numrows = rows[0].length
  // Algorithm: termwidth - (1 each for each column edge + 1 extra)
  const eachColWidth = Math.floor(Math.max(5, (termwidth - numrows - 1) / numrows))
  const colWidths = Array(numrows).fill(eachColWidth)

  const table = new Table({
    head: rows[0],
    colWidths
  })

  rows.slice(1).forEach(row => {
    table.push(row)
  })

  return table.toString()
}

const dumpCsv = async function (resource) {
  const rows = await getRows(resource)
  return CSV.stringify(rows)
}

const dumpMarkdown = async function (resource) {
  const rows = await getRows(resource)
  return mdTable(rows)
}

const dumpXlsx = async function (resource) {
  const rows = await getRows(resource)
  return XLSX.utils.aoa_to_sheet(rows)
}

const dumpers = {
  ascii: dumpAscii,
  csv: dumpCsv,
  md: dumpMarkdown,
  xlsx: dumpXlsx
}

module.exports = {
  dumpAscii,
  dumpCsv,
  dumpMarkdown,
  dumpXlsx,
  dumpers
}
