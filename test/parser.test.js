const test = require('ava')
const toArray = require('stream-to-array')

const {xlsxParser} = require('../lib/utils/parser/xlsx')
const {Resource} = require('../lib/utils/data')

test('xlsxParser works with XLSX files', async t => {
  const path_ = 'test/fixtures/sample.xlsx'
  const resource = await Resource.load(path_)
  const rows = await toArray(await xlsxParser(resource))
  t.deepEqual(rows[0], ['number', 'string', 'boolean'])
})

test('xlsxParser works with XLS files', async t => {
  const path_ = 'test/fixtures/sample.xls'
  const resource = await Resource.load(path_)
  const rows = await toArray(await xlsxParser(resource))
  t.deepEqual(rows[0], ['number', 'string', 'boolean'])
})
