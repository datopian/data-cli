const fs = require('fs')
const test = require('ava')
const nock = require('nock')
const {Dataset} = require('data.js')

const {get} = require('../lib/get.js')

test('get function', async t => {
  const identifier = 'https://github.com/datasets/finance-vix'
  const dataset = await Dataset.load(identifier)
  t.is(dataset.resources.length, 1)
  const res = await get(dataset)
  // Now returned res has length of 3 due to datapackage.json and readme
  t.is(res.length, 3)
})
