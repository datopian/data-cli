const test = require('ava')
const purge = require('../lib/purge')
const nock = require('nock')
const sinon = require('sinon')

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com'
}

const postAuthorize = nock(config.server, {reqheaders : {"auth-token": "t35tt0k3N"}})
      .persist()
      .delete('/api/package/test/package/purge')
      .reply(200, { status: 'OK' })

test.beforeEach(t => {
  t.context.error = console.error
  t.context.log = console.log
  console.error = sinon.spy()
  console.log = sinon.spy()
})

test('Returns status OK if purge is ok', async t => {
  const res = await purge.requestPurge(config,'package','t35tt0k3N')
  const exp = {status: 'OK'}
  t.deepEqual(res, exp)
})

test('Prompt works ok', async t => {
  const dpjson = {'name': 'test'}
  const res = purge.purgePermission(dpjson)
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes('Please, type in the name of the package to confirm'))
})
