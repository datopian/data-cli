const test = require('ava')
const fs = require('fs')
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
