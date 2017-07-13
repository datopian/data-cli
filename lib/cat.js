const toArray = require('stream-to-array')
const Table = require('cli-table')

export const dump_ascii = async function(resource) {
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

	console.log(table.toString());
}

export const dumpers = {
  ascii: dump_ascii
}
