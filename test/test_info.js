const test = require('ava')
const nock = require('nock')
const sinon = require('sinon')

// ours
const { data } = require('./data.js')
const utils = require('../lib/utils/common')
const info = require('../lib/info.js')

test.before(t => {
  const metadata = nock('https://staging.datapackaged.com')
        .persist()
        .get('/api/package/core/co2-ppm')
        .replyWithFile(200, './test/fixtures/co2-ppm/metadata.json')

  const readme = nock('https://bits-staging.datapackaged.com')
        .persist()
        .get('/metadata/core/co2-ppm/_v/latest/README.md')
        .replyWithFile(200, './test/fixtures/co2-ppm/README.md')
})

test.after(t => {
  nock.restore()
})

test.beforeEach(t => {
  t.context.log = console.log
  console.log = sinon.spy()
})

test('gets readme and outputs first paragraph', async t => {
  const result = await info.getInfo('core/co2-ppm')

  t.true(console.log.calledThrice)
  t.true(console.log.firstCall.args[0].includes('CO2 PPM - Trends in Atmospheric Carbon Dioxide.'))
  t.false(console.log.firstCall.args[0].includes('The information on government servers are'))

  console.log.reset()
})

test('gets readme and outputs full content', async t => {
  const result = await info.getInfo('core/co2-ppm')

  t.true(console.log.calledThrice)
  t.true(console.log.thirdCall.args[0].includes('CO2 PPM - Trends in Atmospheric Carbon Dioxide.'))
  t.true(console.log.thirdCall.args[0].includes('The information on government servers are'))

  console.log.reset()
})

test('gets descriptor and outputs list of resources', async t => {
  const result = await info.getInfo('core/co2-ppm')

  t.true(console.log.calledThrice)
  t.true(console.log.secondCall.args[0].includes('co2-mm-mlo'))
  t.true(console.log.secondCall.args[0].includes('co2-annmean-mlo'))
  t.true(console.log.secondCall.args[0].includes('co2-gr-mlo'))
  t.true(console.log.secondCall.args[0].includes('co2-mm-gl'))
  t.true(console.log.secondCall.args[0].includes('co2-annmean-gl'))
  t.true(console.log.secondCall.args[0].includes('co2-gr-gl'))

  console.log.reset()
})
