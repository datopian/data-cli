const test = require('ava')
const fs = require('fs')
const config = require('../lib/config.js')

test('reads from config file', t => {
  let res = config.readConfig('test/fixtures/config')
  let exp = {
    username: 'test',
    accessToken: 'testToken',
    server: 'https://test.com'
  }
  t.deepEqual(res, exp)
})
