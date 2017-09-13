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

