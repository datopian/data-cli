const test = require('ava')

const config = require('../config')

test('gets default configs', t => {
  const api = config.get('api')
  t.is(api, 'http://api.testing.datapackaged.com')
  const domain = config.get('domain')
  t.is(domain, 'http://testing.datapackaged.com')
  const token = config.get('token')
  t.is(token, '')
})

test('sets default configs', t => {
  const token = '123'
  config.set('token', token)
  const out = config.get('token')
  t.is(out, '123')
})
