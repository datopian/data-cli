const test = require('ava')

const config = require('../lib/utils/config')

test('gets default configs', t => {
  const api = config.get('api')
  t.is(api, 'https://api.datahub.io')
  const domain = config.get('domain')
  t.is(domain, 'https://datahub.io')
})

test('sets default configs', t => {
  const token = '123'
  config.set('token', token)
  const out = config.get('token')
  t.is(out, '123')
})
