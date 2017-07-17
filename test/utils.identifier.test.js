const test = require('ava')
const urljoin = require('url-join')

const utils = require('../lib/utils/identifier.js')

const bitstore = utils.PACKAGE_STORE_URL

// ====================================
// parseIdentifier

test('parseIdentifier parses given datahub id string correctly', t => {
  const dpId = 'publisher/package/resource'
  const res = utils.parseIdentifier(dpId)
  const exp = {
    name: 'package',
    owner: 'publisher',
    path: `${bitstore}/metadata/publisher/package/_v/latest`,
    dataPackageJsonPath: `${bitstore}/metadata/publisher/package/_v/latest/datapackage.json`,
    resourcePath: 'resource',
    type: 'datahub',
    original: 'publisher/package/resource',
    version: 'latest'
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with github type', t => {
  const dpId = 'http://github.com/datasets/gdp'
  const res = utils.parseIdentifier(dpId)
  const exp = {
    name: 'gdp',
    owner: 'datasets',
    path: 'http://raw.githubusercontent.com/datasets/gdp/master/',
    dataPackageJsonPath: 'http://raw.githubusercontent.com/datasets/gdp/master/datapackage.json',
    type: 'github',
    original: dpId,
    version: 'master'
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with random url', t => {
  const dpId = `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest`
  const res = utils.parseIdentifier(dpId)
  const exp = {
    name: 'latest',
    owner: null,
    path: `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest/`,
    dataPackageJsonPath: `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest/datapackage.json`,
    type: 'url',
    original: dpId,
    version: ''
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with cwd', t => {
  const dpId = null
  const res = utils.parseIdentifier(dpId)
  const cwd = process.cwd()
  const name = cwd.split('/').pop()
  const exp = {
    name,
    owner: null,
    path: cwd + '/',
    dataPackageJsonPath: urljoin(cwd, 'datapackage.json'),
    type: 'local',
    original: './',
    version: ''
  }
  t.deepEqual(res, exp)
})
