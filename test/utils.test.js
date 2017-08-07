const path = require('path')
const test = require('ava')
const sinon = require('sinon')
const nock = require('nock')

const utils = require('../lib/utils/common.js')

const metadata = {
  // eslint-disable-next-line camelcase
  bitstore_url: 'https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest',
  descriptor: {
    name: 'package',
    owner: 'publisher',
    resources: [
      {
        format: 'csv',
        name: 'firstResource',
        path: 'test/firsts-resource.csv'
      },
      {
        format: 'csv',
        name: 'secondResource',
        url: 'https://example.com/data/second-resource.csv'
      }
    ]
  }
}

const config = {
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
  // eslint-disable-next-line no-unused-vars
  const getMeta = nock('https://staging.datapackaged.com')
    .persist()
    .get('/api/package/publisher/package')
    .reply(200, metadata)
  // eslint-disable-next-line no-unused-vars
  const postToken = nock(config.server)
    .persist()
    .post('/api/auth/token', {
      username: config.username,
      secret: config.secretToken
    })
    .reply(200, {token: 't35tt0k3N'})
  // eslint-disable-next-line no-unused-vars
  const github = nock('https://raw.githubusercontent.com')
    .persist()
    .get('/datahq/datahub-cli/master/test/fixtures/sample.csv')
    .replyWithFile(200, path.join(__dirname, '/fixtures/sample.csv'))
})

test.afterEach(t => {
  console.error.reset()
  console.log.reset()
  console.error = t.context.error
  console.log = t.context.log
})

test.after(t => {
  nock.restore()
  t.pass()
})

test('Checks if datapackage.json exists in cwd', t => {
  const out = utils.checkDpIsThere()
  t.false(out)
})

test('Checks if datapackage.json exists in given dir', t => {
  const out = utils.checkDpIsThere('test/fixtures')
  t.true(out)
})

