const test = require('ava')
const fs = require('fs')
const { data } = require('./data.js')
const config = require('../lib/config.js')

test('reads from config file', t => {
  let res = config.readConfig('test/fixtures/config')
  let exp = {
    username: 'test',
    accessToken: 'testToken',
    server: 'https://test.com',
    bitStore: 'https://bits-test.com'
  }
  t.deepEqual(res, exp)
})

test('server and bitStore is set by default', t => {
  t.is(config.defaultServer, 'https://staging.datapackaged.com')
  t.is(config.defaultBitStore, 'https://bits-staging.datapackaged.com')
})

test('"data help config" prints help message for config command', async t => {
  const result = await data('help', 'config')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))
})

test('"data config -h --help" prints help message for config command', async t => {
  let result = await data('config', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))

  result = await data('config', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))
})
