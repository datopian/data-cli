const assert = require('assert')
const fs = require('fs')
const get = require('../lib/index.js').get
const nock = require('nock')
const tmp = require('tmp');

let tmpobj = tmp.dirSync();

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
let getFromBitstoreUrl = nock('https://bits-staging.datapackaged.com')
      .persist()
      .get('/metadata/publisher/package/_v/latest/test/firsts-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')
let getFromSourceUrl = nock('https://example.com')
      .persist()
      .get('/data/second-resource.csv')
      .replyWithFile(200, './test/fixtures/sample.csv')

describe('get', () => {

  it('New dir is created if [dest] is provided', () => {
    assert.equal(fs.existsSync(tmpobj.name + '/test'), false)
    get('publisher', 'package', null, tmpobj.name + '/test')
    assert.equal(fs.existsSync(tmpobj.name + '/test'), true)
  })

  it('URL for geeting metadata is called', () => {
    assert.equal(getMeta.isDone(), true)
  })

  it('Bitstore URL is called if there is path', () => {
    get('publisher', 'package', null, tmpobj.name + '/test')
    assert.equal(getFromBitstoreUrl.isDone(), true)
  })

  it('External URL is called if resource has URL instead of path', () => {
    get('publisher', 'package', null, tmpobj.name + '/test')
    assert.equal(getFromSourceUrl.isDone(), true)
  })
})
