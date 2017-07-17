const test = require('ava')

const data = require('../lib/utils/data.js')
const info = require('../lib/info.js')

test('info works', async t => {
  const pkg = await data.Package.load('test/fixtures/co2-ppm')
  const out = info.info(pkg)
  t.true(out.includes('CO2 PPM - Trends in Atmospheric Carbon Dioxide.'))
})
