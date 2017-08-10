const test = require('ava')

const data = require('../lib/utils/data.js')
const info = require('../lib/info.js')

test('infoPackage works', async t => {
  const pkg = await data.Dataset.load('test/fixtures/co2-ppm')
  const out = info.infoPackage(pkg)
  t.true(out.includes('CO2 PPM - Trends in Atmospheric Carbon Dioxide.'))
})

test('infoResource works', async t => {
  const resource = data.File.load('test/fixtures/sample.csv')
  const out = await info.infoResource(resource)
  t.true(out.includes('number'))
})
