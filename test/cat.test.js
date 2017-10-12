const test = require('ava')

const {File} = require('data.js')
const {writers} = require('../lib/cat')
const {runcli} = require('./cli.test.js')
const {streamToString} = require('../lib/utils/stream')

const resource = File.load('test/fixtures/sample.csv')


test('dumpAscii works', async t => {
  const stream = await writers.ascii(resource)
  const out = await streamToString(stream)
  t.true(out.includes('number'))
})

test('dumpCsv works', async t => {
  const stream = await writers.csv(resource)
  const out = await streamToString(stream)
  t.true(out.includes('number,string,boolean'))
})

test('dumpMarkdown works', async t => {
  const stream = await writers.md(resource)
  const out = await streamToString(stream)
  t.true(out.includes('| number | string | boolean |'))
})

test('dumpXlsx works', async t => {
  const stream = await writers.xlsx(resource)
  const out = await streamToString(stream)
  t.true(out.includes('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'))
})

test('dumpHtml works', async t => {
  const stream = await writers.html(resource)
  const out = await streamToString(stream)
  const expected = `<table class="table table-striped table-bordered">\n<thead>\n<th>number</th>\n<th>string</th>\n<th>boolean</th>\n</thead>\n<tbody>\n<tr>\n<td>1</td>\n<td>two</td>\n<td>true</td>\n</tr>\n<tr>\n<td>3</td>\n<td>four</td>\n<td>false</td>\n</tr>\n</tbody>\n</table>`
  t.is(out, expected)
})
