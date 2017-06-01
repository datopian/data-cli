const test = require('ava')
const get = require('../lib/get.js')
const nock = require('nock')

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
  let res = get.getBitstoreUrl('publisher', 'package', sUrl)
  t.is(await res, metadata.bitstore_url)
})
