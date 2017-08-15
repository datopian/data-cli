const fs = require('fs')
const test = require('ava')
const nock = require('nock')
const tmp = require('tmp')

const get = require('../lib/get.js')

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
  const dataset = tempDirPath[tempDirPath.length - 1]
  const res = get.checkDestIsEmpty('/' + publisher, dataset)
  t.true(res)
})

test('checkDestIsEmpty returns true if dir does not exist', t => {
  const tempDirPath = tmpdir.split('/')
  const publisher = tempDirPath[tempDirPath.length - 1]
  const dataset = 'new'
  const res = get.checkDestIsEmpty('/' + publisher, dataset)
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
  const dataset = 'package'
  const mockBar = {tick: () => {}}
  await get.downloadFile(bUrl, path, publisher, dataset, mockBar)
  t.true(fs.existsSync(publisher, dataset, path))
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

