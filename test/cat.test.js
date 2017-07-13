const test = require('ava')

const { Resource } = require('../lib/utils/data')
const { dumpers } = require('../lib/cat')

const resource = Resource.load('test/fixtures/sample.csv')

test('dumpAscii works', async t => {
  const out = await dumpers['ascii'](resource)
  t.true(out.includes('number'))
})

test('dumpCsv works', async t => {
  const out = await dumpers['csv'](resource)
  t.true(out.includes('number,string,boolean'))
})

test('dumpMarkdown works', async t => {
  const out = await dumpers['md'](resource)
  t.true(out.includes('| number | string | boolean |'))
})
