const Readable = require('stream').Readable
const XLSX = require('xlsx')
const parse = require('csv-parse')

export const xlsxParser = async resource => {
  const buffer = await resource.buffer
  const workbook = XLSX.read(buffer, {type: 'buffer'})
  // For now we handle only first sheet
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const csv = XLSX.utils.sheet_to_csv(sheet)
  const stream = new Readable()
  stream.push(csv)
  stream.push(null)
  return stream.pipe(parse())
}
