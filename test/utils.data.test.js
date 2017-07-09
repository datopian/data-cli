const test = require('ava')

const toArray = require('stream-to-array')

const utils = require('../lib/utils/data.js')

// ====================================
// isUrl

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

// ====================================
// parsePath

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


// ====================================
// Resource class

test('Resource class with descriptor / path', t => {
  const path_ = 'test/fixtures/sample.csv'
  const descriptor = {path: 'test/fixtures/sample.csv'}
  const obj1 = new utils.Resource(path_)
  const obj2 = new utils.Resource(descriptor)
  t.is(obj1.descriptor.path, 'test/fixtures/sample.csv')
  t.is(obj2.descriptor.path, 'test/fixtures/sample.csv')
})

test.serial('Resource class for "stream" method', async t => {
  const path_ = 'test/fixtures/sample.csv'
  let res = new utils.Resource(path_)
  let stream = await res.stream
  let out = await toArray(stream)
  t.true(out.toString().includes('number,string,boolean'))

  const url = 'https://raw.githubusercontent.com/datahq/datahub-cli/master/test/fixtures/sample.csv'
  res = new utils.Resource(url)
  stream = await res.stream
  out = await toArray(stream)
  t.true(out.toString().includes('number,string,boolean'))
})

test.serial('Resource class for getting "rows" method', async t => {
  const path_ = 'test/fixtures/sample.csv'
  let res = new utils.Resource(path_)
  let rowStream = res.rows
  let out = await utils.objectStreamToArray(rowStream)
  t.deepEqual(out[0], ['number', 'string', 'boolean'])
  t.deepEqual(out[1], ['1', 'two', 'true'])
})

