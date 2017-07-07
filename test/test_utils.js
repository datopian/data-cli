const test = require('ava')
const fs = require('fs')
const chalk = require('chalk')
const { logger } = require('../lib/utils/log-handler.js')
const sinon = require('sinon')
const nock = require('nock')
const urljoin = require('url-join')
const toArray = require('stream-to-array')
const utils = require('../lib/utils/common.js')

let metadata = {
  "bitstore_url": "https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest",
  "descriptor": {
    "name": "package",
    "owner": "publisher",
    "resources": [
      {
        "format": "csv",
        "name": "firstResource",
        "path": "test/firsts-resource.csv"
      },
      {
        "format": "csv",
        "name": "secondResource",
        "url": "https://example.com/data/second-resource.csv"
      }
    ]
  }
}

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com',
  bitStore: 'https://bits-test.com'
}

test.beforeEach(t => {
  t.context.error = console.error
  t.context.log = console.log
  console.error = sinon.spy()
  console.log = sinon.spy()

  let getMeta = nock('https://staging.datapackaged.com')
    .persist()
    .get('/api/package/publisher/package')
    .reply(200, metadata)

  let postToken = nock(config.server)
    .persist()
    .post('/api/auth/token', {
      username: config.username,
      secret: config.secretToken
    })
    .reply(200, { token: 't35tt0k3N' })

  let github = nock('https://raw.githubusercontent.com')
    .persist()
    .get('/datahq/datahub-cli/master/test/fixtures/sample.csv')
    .replyWithFile(200, __dirname + '/fixtures/sample.csv')
})

test.afterEach(t => {
  console.error.reset()
  console.log.reset()
  console.error = t.context.error
  console.log = t.context.log
})

test.after(t => {
  nock.restore()
})

test.serial('Error log is working fine', t => {
  logger('error message', 'error')
  const exp = `${chalk.bold.red('Error:')} error message`
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes(exp))
})

test.serial('Warning log is working fine', t => {
  logger('warning message', 'warning')
  const exp = `${chalk.bold.yellow('Warning:')} warning message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})

test.serial('Aborting log is working fine', t => {
  logger('aborting message', 'abort')
  const exp = `${chalk.bold.yellow('Aborting:')} aborting message`
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes(exp))
})


test.serial('Success log is working fine', t => {
  logger('Success message', 'success')
  const exp = `${chalk.bold.green('Success:')} Success message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})

test.serial('default log is working fine', t => {
  logger('Success message')
  const exp = `Success message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})

test('Reads bitStore URL from config', t => {
  let bitStoreUrl = utils.getBitStoreUrl('test/fixtures/config')
  let exp = 'https://bits-test.com'
  t.is(bitStoreUrl, exp)

  bitStoreUrl = utils.getBitStoreUrl()
  exp = 'https://bits-staging.datapackaged.com'
  t.is(bitStoreUrl, exp)
})

test('Reads server URL from config', t => {
  let sUrl = utils.getServerUrl('test/fixtures/config')
  let expUrl = 'https://test.com'
  t.is(sUrl, expUrl)
})

test('Uses default server URL if config not found', t => {
  let sUrl = utils.getServerUrl('not/config')
  let expUrl = 'http://testing.datapackaged.com'
  t.is(sUrl, expUrl)
})

test('Checks if datapackage.json exists in cwd', t => {
  let out = utils.checkDpIsThere()
  t.false(out)
})

test('Checks if datapackage.json exists in given dir', t => {
  let out = utils.checkDpIsThere('test/fixtures')
  t.true(out)
})

test.serial('Gets the token', async t => {
  const token = await utils.getToken(config)
  const expToken = 't35tt0k3N'
  t.is(token, expToken)
})

test('Tests if given path is url or not', t => {
  let notUrl = 'not/url/path'
  let res = utils.isUrl(notUrl)
  t.false(res)
  notUrl = '/not/url/path/'
  res = utils.isUrl(notUrl)
  t.false(res)
  let url = 'https://test.com'
  res = utils.isUrl(url)
  t.true(res)
  url = 'http://test.com'
  res = utils.isUrl(url)
  t.true(res)
  url = 'HTTP://TEST.COM'
  res = utils.isUrl(url)
  t.true(res)
  url = '//test.com'
  res = utils.isUrl(url)
  t.true(res)
})

test('parsePath function with local path', t => {
  const path_ = 'test/fixtures/sample.csv'
  const res = utils.parsePath(path_)
  t.is(res.path, path_)
  t.is(res.pathType, 'local')
  t.is(res.name, 'sample')
  t.is(res.format, 'csv')
  t.is(res.mediatype, 'text/csv')
  t.is(res.encoding, 'ISO-8859-1')
})

test('parsePath function with remote url', t => {
  const path_ = 'https://raw.githubusercontent.com/datasets/finance-vix/master/data/vix-daily.csv'
  const res = utils.parsePath(path_)
  t.is(res.path, path_)
  t.is(res.pathType, 'remote')
  t.is(res.name, 'vix-daily')
  t.is(res.format, 'csv')
  t.is(res.mediatype, 'text/csv')
  t.is(res.encoding, null)
})

test('DataResource class with descriptor / path', t => {
  const path_ = 'test/fixtures/sample.csv'
  const descriptor = {path: 'test/fixtures/sample.csv'}
  const obj1 = new utils.DataResource(path_)
  const obj2 = new utils.DataResource(descriptor)
  t.is(obj1.descriptor.path, 'test/fixtures/sample.csv')
  t.is(obj2.descriptor.path, 'test/fixtures/sample.csv')
})

test.serial('DataResource class for "stream" method', async t => {
  const path_ = 'test/fixtures/sample.csv'
  let res = new utils.DataResource(path_)
  let stream = await res.stream
  let out = await toArray(stream)
  t.true(out.toString().includes('number,string,boolean'))

  const url = 'https://raw.githubusercontent.com/datahq/datahub-cli/master/test/fixtures/sample.csv'
  res = new utils.DataResource(url)
  stream = await res.stream
  out = await toArray(stream)
  t.true(out.toString().includes('number,string,boolean'))
})

test.serial('DataResource class for getting "rows" method', async t => {
  const path_ = 'test/fixtures/sample.csv'
  let res = new utils.DataResource(path_)
  let rowStream = res.rows
  let out = await utils.objectStreamToArray(rowStream)
  t.deepEqual(out[0], ['number', 'string', 'boolean'])
  t.deepEqual(out[1], ['1', 'two', 'true'])
})
