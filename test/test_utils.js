require("babel-core/register")
require("babel-polyfill")
const test = require('ava')
const chalk = require('chalk')
const { logger } = require('../lib/utils/log-handler.js')
const sinon = require('sinon')
const nock = require('nock')
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
  const exp = `${chalk.bold.green('Success:')} Success message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})


// common

test('parseIdentifier parses given string correctly', t => {
  let dpId = 'publisher/package/resource'
  let res = utils.parseIdentifier(dpId, 'datahub')
  let exp = {
    name: "package",
    publisher: "publisher",
    path: "https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest",
    dataPackageJsonPath: "https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latestdatapackage.json",
    resourcePath: "resource",
    type: "datahub",
    original: "publisher/package/resource",
    version: "latest"
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with non-datahub type', t => {
  let dpId = 'http://github.com/datasets/gdp'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "gdp",
    url: "http://raw.githubusercontent.com/datasets/gdp/master/",
    dataPackageJsonUrl: "http://raw.githubusercontent.com/datasets/gdp/master/datapackage.json",
    original: "http://github.com/datasets/gdp",
    originalType: "",
    version: "master"
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
