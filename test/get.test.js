const fs = require('fs')
const test = require('ava')
const nock = require('nock')
const tmp = require('tmp')

const get = require('../lib/get.js')
const {data} = require('./data.js')

const tmpdir = tmp.dirSync({template: '/tmp/tmp-XXXXXX'}).name
const tmpfile = tmp.fileSync({template: '/tmp/tmp-XXXXXX.file'}).name

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
// eslint-disable-next-line no-unused-vars
const getDPJson = nock('https://bits-staging.datapackaged.com')
      .persist()
      .get('/metadata/publisher/package/_v/latest' + tmpfile)
      .reply(200, metadata.descriptor)
// eslint-disable-next-line no-unused-vars
const getFromBitstoreUrl = nock('https://bits-staging.datapackaged.com')
      .persist()
      .get('/metadata/publisher/package/_v/latest/test/firsts-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')
// eslint-disable-next-line no-unused-vars
const getFromSourceUrl = nock('https://example.com')
      .persist()
      .get('/data/second-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')

test('checkDestIsEmpty returns true if dir exists and is empty', t => {
  const tempDirPath = tmpdir.split('/')
  const publisher = tempDirPath[tempDirPath.length - 2]
  const pkg = tempDirPath[tempDirPath.length - 1]
  const res = get.checkDestIsEmpty('/' + publisher, pkg)
  t.true(res)
})

test('checkDestIsEmpty returns true if dir does not exist', t => {
  const tempDirPath = tmpdir.split('/')
  const publisher = tempDirPath[tempDirPath.length - 1]
  const pkg = 'new'
  const res = get.checkDestIsEmpty('/' + publisher, pkg)
  t.true(res)
})

test('checkDestIsEmpty returns false if dir exists and not empty', t => {
  const tempFilePath = tmpfile.split('/')
  const publisher = tempFilePath[tempFilePath.length - 2]
  const res = get.checkDestIsEmpty('/' + publisher, '')
  t.false(res)
})

test('downloadFile function works', async t => {
  const bUrl = 'https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest' + tmpfile
  const path = tmpfile
  const publisher = '/' + tmpdir.split('/')[1]
  const pkg = 'package'
  const mockBar = {tick: () => {}}
  await get.downloadFile(bUrl, path, publisher, pkg, mockBar)
  t.true(fs.existsSync(publisher, pkg, path))
})

test('get list of download files', t => {
  const exp = [
    {destPath: 'datapackage.json', url: metadata.bitstore_url + '/datapackage.json'},
    {destPath: 'README', url: metadata.bitstore_url + '/README'},
    {destPath: 'README.md', url: metadata.bitstore_url + '/README.md'},
    {destPath: 'README.txt', url: metadata.bitstore_url + '/README.txt'},
    {destPath: 'test/firsts-resource.csv', url: metadata.bitstore_url + '/test/firsts-resource.csv'},
    {destPath: 'data/second-resource.csv', url: 'https://example.com/data/second-resource.csv'}
  ]
  const res = get.getFilesToDownload(metadata.bitstore_url, metadata.descriptor)
  t.deepEqual(exp, res)
})

test('"data help get" prints help message for get command', async t => {
  const result = await data('help', 'get')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))
})

test('"data get -h --help" prints help message for get command', async t => {
  let result = await data('get', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))

  result = await data('get', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))
})
