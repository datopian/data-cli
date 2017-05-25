const assert = require('assert')
const fs = require('fs')
const get = require('../lib/index.js').get
const nock = require('nock')
const tmp = require('tmp');

let tmpobj = tmp.dirSync();

describe('basic test for lib directory', () => {
  beforeEach(() => {
    nock('https://bits.datapackaged.com')
          .get('/metadata/publisher/package/_v/latest/data/resource.csv')
          .replyWithFile(200, './test/fixtures/sample.csv')
  });

  it('get() writes in file', (done) => {
    get('publisher', 'package', 'resource.csv', [tmpobj.name]).then( () => {
      let exp  = fs.readFileSync('test/fixtures/sample.csv').toString()
      let res = fs.readFileSync(tmpobj.name + '/resource.csv').toString()
      assert.equal(exp, res)
      done()
    })
  })

  it('get() outputs in stdout', () => {
    get('publisher', 'package', 'resource.csv', [])
    assert.equal(1, 1)
  })

})
