const test = require('ava')
const fs = require('fs')
const get = require('../lib/get.js')
const nock = require('nock')
const tmp = require('tmp');

let tmpdir = tmp.dirSync().name;
let tmpfile = tmp.fileSync().name;

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

let getMeta = nock('https://staging.datapackaged.com')
      .persist()
      .get('/api/package/publisher/package')
      .reply(200, metadata)

let getDPJson = nock('https://bits-staging.datapackaged.com')
      .persist()
      .get('/metadata/publisher/package/_v/latest' + tmpfile)
      .reply(200, metadata.descriptor)

let getFromBitstoreUrl = nock('https://bits-staging.datapackaged.com')
      .persist()
      .get('/metadata/publisher/package/_v/latest/test/firsts-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')

let getFromSourceUrl = nock('https://example.com')
      .persist()
      .get('/data/second-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')

test('Reads server URL from config', t => {
  let sUrl = get.getServerUrl('test/fixtures/config')
  let expUrl = 'https://test.com'
  t.is(sUrl, expUrl)
})

test('Uses default server URL if config not found', t => {
  let sUrl = get.getServerUrl('not/config')
  let expUrl = 'https://staging.datapackaged.com'
  t.is(sUrl, expUrl)
})

test('Gets bitStoreUrl if publisher and package is fine', async t => {
  let sUrl = get.getServerUrl('not/config')
  let res = get.getMetadata('publisher', 'package', sUrl)
  t.deepEqual(await res, metadata)
})

test('checkDestIsEmpty returns true if dir exists and is empty', t => {
  let [ _, publisher, pkg ] = tmpdir.split('/')
  let res = get.checkDestIsEmpty('/'+publisher, pkg)
  t.true(res)
})

test('checkDestIsEmpty returns true if dir does not exist', t => {
  let [ publisher, pkg ] = [ tmpdir.split('/')[1], 'new' ]
  let res = get.checkDestIsEmpty('/'+publisher, pkg)
  t.true(res)
})

test('checkDestIsEmpty returns false if dir exists and not empty', t => {
  let publisher = tmpfile.split('/')[0]
  let res = get.checkDestIsEmpty('/'+publisher, '')
  t.false(res)
})

test('downloadFiles works', async t => {
  let bUrl = 'https://bits-staging.datapackaged.com/metadata/publisher/package/_v/latest'+tmpfile
  let path = tmpfile
  let publisher = '/'+tmpdir.split('/')[1]
  let pkg = 'package'
  await get.downloadFile(bUrl, path, publisher, pkg)
  t.true(fs.existsSync(publisher, pkg, path))
})

test('parseDataHubIdentifier parses correctly', t => {
  let dhpkgid = 'publisher/package/resource'
  let res = get.parseDataHubIdentifier(dhpkgid)
  let exp = {
    path: "resource",
    pkg: "package",
    publisher: "publisher",
  }
  t.deepEqual(res, exp)
})


test('get list of download files', t => {
  let exp = [
    {destPath: 'datapackage.json', url: metadata.bitstore_url+'/datapackage.json'},
    {destPath: 'README', url: metadata.bitstore_url+'/README'},
    {destPath: 'README.md', url: metadata.bitstore_url+'/README.md'},
    {destPath: 'README.txt', url: metadata.bitstore_url+'/README.txt'},
    {destPath: "test/firsts-resource.csv", url: metadata.bitstore_url+'/test/firsts-resource.csv'},
    {destPath: "data/second-resource.csv", url: 'https://example.com/data/second-resource.csv'}
  ]
  let res = get.getFilesToDownload(metadata.bitstore_url, metadata.descriptor)
  t.deepEqual(exp, res)
})
