const test = require('ava')
const get = require('../lib/get.js')

test('Reads server URL from config', t => {
  let sUrl = get.getServerUrl('test/fixtures/config')
  let expUrl = 'https://test.com'
  t.is(sUrl, expUrl)
})

test('Uses default server URL if config not found', t => {
  let sUrl = get.getServerUrl('not/config')
  let expUrl = 'https://staging.datapackaged.com'
  t.is(sUrl, expUrl)
})
