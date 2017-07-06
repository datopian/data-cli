const test = require('ava')

const {isAuthenticated} = require('../lib/utils/authenticate.js')

test('check if authenticated', async t => {
  let config = {token: '123'}
  let out = await isAuthenticated(config)
  t.false(out)
})
