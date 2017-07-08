const test = require('ava')
const purge = require('../lib/purge')
const nock = require('nock')
const sinon = require('sinon')
const { data } = require('./data.js')

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

test('"data help purge" prints help message for purge command', async t => {
  const result = await data('help', 'purge')
  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))
})

test('"data purge -h --help" prints help message for purge command', async t => {
  let result = await data('purge', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))

  result = await data('purge', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))
})
