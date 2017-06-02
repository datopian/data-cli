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

test('Gets correct file info for regular file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/sample.csv')
  const exp = {
    md5: "b0661d9566498a800fbf95365ce28747",
    name: "test/fixtures/sample.csv",
    size: 46,
    type: "binary/octet-stream",
  }
  t.deepEqual(fileInfo, exp)
})

test('Gets correct file info for json file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/datapackage.json')
  const exp = {
    md5: "a2a917cc462afa205b7ae46c590ebf55",
    name: "test/fixtures/datapackage.json",
    size: 305,
    type: "application/json",
  }
  t.deepEqual(fileInfo, exp)
})
