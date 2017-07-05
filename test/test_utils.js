const test = require('ava')
const chalk = require('chalk')
const { logger } = require('../lib/utils/log-handler.js')
const sinon = require('sinon')
const nock = require('nock')
const urljoin = require('url-join')
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


// common

test('parseIdentifier parses given datahub id string correctly', t => {
  let dpId = 'publisher/package/resource'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "package",
    owner: "publisher",
    path: "https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest",
    dataPackageJsonPath: "https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest/datapackage.json",
    resourcePath: "resource",
    type: "datahub",
    original: "publisher/package/resource",
    version: "latest"
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with github type', t => {
  let dpId = 'http://github.com/datasets/gdp'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "gdp",
    owner: "datasets",
    path: "http://raw.githubusercontent.com/datasets/gdp/master/",
    dataPackageJsonPath: "http://raw.githubusercontent.com/datasets/gdp/master/datapackage.json",
    type: "github",
    original: dpId,
    version: "master"
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with random url', t => {
  let dpId = 'https://bits-staging.datapackaged.com/metadata/core/s-and-p-500-companies/_v/latest'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "latest",
    owner: null,
    path: "https://bits-staging.datapackaged.com/metadata/core/s-and-p-500-companies/_v/latest/",
    dataPackageJsonPath: "https://bits-staging.datapackaged.com/metadata/core/s-and-p-500-companies/_v/latest/datapackage.json",
    type: "url",
    original: dpId,
    version: ""
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with cwd', t => {
  let dpId = undefined
  let res = utils.parseIdentifier(dpId)
  let cwd = process.cwd()
  let exp = {
    name: "datahub-cli",
    owner: null,
    path: cwd + '/',
    dataPackageJsonPath: urljoin(cwd, 'datapackage.json'),
    type: "local",
    original: './',
    version: ""
  }
  t.deepEqual(res, exp)
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
  let expUrl = 'https://staging.datapackaged.com'
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

test('Gets bitStoreUrl if publisher and package is fine', async t => {
  let sUrl = utils.getServerUrl('not/config')
  let res = utils.getMetadata('publisher', 'package', sUrl)
  t.deepEqual(await res, metadata)
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

test.serial('DataStream class', async t => {
  const path_ = 'test/fixtures/sample.csv'
  let dataStreamObj = new utils.DataStream(path_)
  let res = await dataStreamObj.getRawStream()
  t.is(res.stream.constructor.name, 'ReadStream')

  const url = 'https://raw.githubusercontent.com/datasets/finance-vix/master/data/vix-daily.csv'
  dataStreamObj = new utils.DataStream(url)
  res = await dataStreamObj.getRawStream()
  t.is(res.stream.constructor.name, 'IncomingMessage')
})
