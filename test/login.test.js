const test = require('ava')

const login = require('../lib/login')
const config = require('../lib/config')

test('extracts token and save', t => {
  let url = 'http://localhost:3000/?jwt=abc'
  let token = login._extractToken(url)
  t.is(token, 'abc')
})

