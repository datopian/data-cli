const assert = require('assert')
const fs = require('fs')
const config = require('../lib/config.js')

describe('Test config functions', () => {

  it('reads from config file', () => {
    let res = config.readConfig('test/fixtures/config')
    let exp = {
      username: 'test',
      accessToken: 'testToken',
      server: 'https://test.com'
    }
    assert.deepEqual(res, exp)
  })
})
