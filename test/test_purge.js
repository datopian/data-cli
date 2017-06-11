require("babel-core/register")
require("babel-polyfill")
const test = require('ava')
const purge = require('../lib/purge')
const nock = require('nock')

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com'
}

const postAuthorize = nock(config.server, {reqheaders : {"auth-token": "t35tt0k3N"}})
      .persist()
      .delete('/api/package/test/package/purge')
      .reply(200, { status: 'OK' })

test('Returns status OK if purge is ok', async t => {
  const res = await purge.requestPurge(config,'package','t35tt0k3N')
  const exp = {status: 'OK'}
  t.deepEqual(res, exp)
})
