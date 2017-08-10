const test = require('ava')

const {File} = require('../lib/utils/data')
const {dumpers} = require('../lib/cat')

const resource = File.load('test/fixtures/sample.csv')

test('dumpAscii works', async t => {
  const out = await dumpers.ascii(resource)
  t.true(out.includes('number'))
})

test('dumpCsv works', async t => {
  const out = await dumpers.csv(resource)
  t.true(out.includes('number,string,boolean'))
})

test('dumpMarkdown works', async t => {
  const out = await dumpers.md(resource)
  t.true(out.includes('| number | string | boolean |'))
})

test('dumpXlsx works', async t => {
  // Xlsx dumper returns a sheet
  const out = await dumpers.xlsx(resource)
  t.is(out['!ref'], 'A1:C3')
  t.deepEqual(out.A1, {t: 's', v: 'number'})
})
