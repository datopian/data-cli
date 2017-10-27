const stream = require('stream')

const toArray = require('stream-to-array')
const Table = require('cli-table')
const mdTable = require('markdown-table')
const CSV = require('csv-stringify')
const XLSX = require('xlsx')

const {stringToStream} = require('./utils/stream')


const dumpAscii = async function (resource, {limit}={}) {
  const rows = await toArray(await resource.rows())

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

  limit = limit ? limit : rows.length
  limit = limit > rows.length ? rows.length : limit
  for (let i = 1; i < limit; i++) {
    table.push(rows[i])
  }

  return stringToStream(table.toString())
}

const dumpCsv = async function (resource) {
  const stringifier = CSV()
  const rows = await resource.rows()
  return rows.pipe(stringifier)
}

const dumpMarkdown = async function (resource) {
  const rows = await toArray(await resource.rows())
  return stringToStream(mdTable(rows))
}

const dumpXlsx = async function (resource) {
  const rows = await toArray(await resource.rows())
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  const wb = {SheetNames: ['sheet'], Sheets: {sheet: sheet}}
  const string = XLSX.write(wb, {type: 'buffer'})
  return stringToStream(string)
}

const dumpHtml = async function (resource) {
  const rows = await toArray(await resource.rows())
  let thead = `<thead>`
  rows[0].forEach(col => {
    thead += `\n<th>${col}</th>`
  })
  thead += '\n</thead>'
  let tbody = '<tbody>'
  rows.slice(1).forEach(row => {
    let tr = '\n<tr>'
    row.forEach(col => {
      tr += `\n<td>${col}</td>`
    })
    tr += '\n</tr>'
    tbody += tr
  })
  tbody += '\n</tbody>'
  let table = `<table class="table table-striped table-bordered">\n${thead}\n${tbody}\n</table>`
  return stringToStream(table)
}

const writers = {
  ascii: dumpAscii,
  csv: dumpCsv,
  md: dumpMarkdown,
  xlsx: dumpXlsx,
  html: dumpHtml
}

module.exports = {
  dumpAscii,
  dumpCsv,
  dumpMarkdown,
  dumpXlsx,
  dumpHtml,
  writers
}
