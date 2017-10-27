const test = require('ava')

const data = require('data.js')
const info = require('../lib/info.js')
const {runcli} = require('./cli.test.js')

test('infoPackage works', async t => {
  const dataset = await data.Dataset.load('test/fixtures/co2-ppm')
  const out = info.infoPackage(dataset)
  t.true(out.includes('CO2 PPM - Trends in Atmospheric Carbon Dioxide.'))
})

test('infoResource works', async t => {
  const resource = data.File.load('test/fixtures/sample.csv')
  const out = await info.infoResource(resource)
  t.true(out.includes('number'))
})

// =====================
// CLI tests
test('info command with a dataset', async t => {
  const identifier = 'test/fixtures/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('CBOE Volatility Index (VIX)'))
})

test('info command with a file', async t => {
  const identifier = 'test/fixtures/sample.csv'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('File descriptor:'))
})
