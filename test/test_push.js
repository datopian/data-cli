const test = require('ava')
const push = require('../lib/push')
const nock = require('nock')

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com'
}

const postToken = nock(config.server)
      .persist()
      .post('/api/auth/token', {
        username: config.username,
        secret: config.secretToken
      })
      .reply(200, { token: 't35tt0k3N' })


test('Gets the token', async t => {
  const token = await push.getToken(config)
  const expToken = 't35tt0k3N'
  t.is(token, expToken)
})


test('Checks if datapackage.json exists in cwd', t => {
  let out = push.checkDpIsThere()
  t.false(out)
})
