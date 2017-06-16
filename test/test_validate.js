const test = require('ava')
const nock = require('nock')
const urljoin = require('url-join')
const { validate } = require('../lib/validate')
const { data } = require('./data.js')

test.before(t => {
  const mock = nock('https://bits-staging.datapackaged.com')
        .persist()
        .get('/metadata/core/co2-ppm/_v/latest/datapackage.json')
        .replyWithFile(200, './test/fixtures/co2-ppm/datapackage.json')
})

test('validate works with datahub pkg id', async t => {
  const owner = 'core'
  const name = 'co2-ppm'
  const res = await validate(urljoin(owner, name))
  t.true(res)
})

test('validate works with github id', async t => {
  const pkgid = 'https://github.com/datasets/gdp'
  const res = await validate(pkgid)
  t.true(res)
})

test('"data help validate" prints help message', async t => {
  const result = await data('help', 'validate')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Validate a descriptor'))
})
