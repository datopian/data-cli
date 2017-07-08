const test = require('ava')
const urljoin = require('url-join')

const utils = require('../lib/utils/identifier.js')


const bitstore = utils.PACKAGE_STORE_URL

// ====================================
// parseIdentifier

test('parseIdentifier parses given datahub id string correctly', t => {
  let dpId = 'publisher/package/resource'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "package",
    owner: "publisher",
    path: `${bitstore}/metadata/publisher/package/_v/latest`,
    dataPackageJsonPath: `${bitstore}/metadata/publisher/package/_v/latest/datapackage.json`,
    resourcePath: "resource",
    type: "datahub",
    original: "publisher/package/resource",
    version: "latest"
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with github type', t => {
  let dpId = 'http://github.com/datasets/gdp'
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "gdp",
    owner: "datasets",
    path: "http://raw.githubusercontent.com/datasets/gdp/master/",
    dataPackageJsonPath: "http://raw.githubusercontent.com/datasets/gdp/master/datapackage.json",
    type: "github",
    original: dpId,
    version: "master"
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with random url', t => {
  let dpId = `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest`
  let res = utils.parseIdentifier(dpId)
  let exp = {
    name: "latest",
    owner: null,
    path: `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest/`,
    dataPackageJsonPath: `${bitstore}/metadata/core/s-and-p-500-companies/_v/latest/datapackage.json`,
    type: "url",
    original: dpId,
    version: ""
  }
  t.deepEqual(res, exp)
})

test('parseIdentifier works with cwd', t => {
  let dpId = undefined
  let res = utils.parseIdentifier(dpId)
  let cwd = process.cwd()
  let name = cwd.split('/').pop() 
  let exp = {
    name: name,
    owner: null,
    path: cwd + '/',
    dataPackageJsonPath: urljoin(cwd, 'datapackage.json'),
    type: "local",
    original: './',
    version: ""
  }
  t.deepEqual(res, exp)
})

