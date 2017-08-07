const path = require('path')
const test = require('ava')
const nock = require('nock')

const {validate, validateMetadata, validateData, Profile} = require('../lib/validate')

nock('http://example.com')
  .persist()
  .get('/data-package.json')
  .replyWithFile(200, path.join(__dirname, '../lib/schema/data-package.json'))
  .get('/profile.json')
  .replyWithError(400)

// ====================================
// validate function
// ====================================

test('validate function', async t => {
  // Returns true if valid
  const descriptor = {
    name: 'valid-descriptor',
    resources: [
      {
        name: 'name',
        path: 'path'
      }
    ]
  }
  const valid = await validate(descriptor)
  t.true(valid)

  const invalidDescriptor = {
    resources: []
  }
  const invalid = await validate(invalidDescriptor)
  t.true(invalid[0].toString().includes('Array is too short (0), minimum 1'))
})

test('validate function with resource', async t => {
  const basePath = path.join(__dirname, './fixtures/finance-vix/')
  const descriptor = require(path.join(basePath, 'datapackage.json'))
  const out = await validate(descriptor, basePath)
  t.true(out)
})

test('validate function with invalid resource', async t => {
  const basePath = path.join(__dirname, './fixtures/invalid-finance-vix/')
  const descriptor = require(path.join(basePath, 'datapackage.json'))
  const out = await validate(descriptor, basePath)
  t.true(out[0].toString().includes('Error: Wrong type for header: VIXOpen and value: 17.96'))
})

// ====================================
// validateData funciton
// ====================================

test('it validateData function works with valid schema and data', async t => {
  const basePath = path.join(__dirname, './fixtures/finance-vix/')
  const dpjson = require(path.join(basePath, 'datapackage.json'))
  const descriptor = dpjson.resources[0]
  const path_ = path.join(basePath, descriptor.path)
  const valid = await validateData(descriptor.schema, path_)
  t.true(valid)
})

test('validateData fails if data is not valid against schema', async t => {
  const basePath = path.join(__dirname, './fixtures/invalid-finance-vix/')
  const dpjson = require(path.join(basePath, 'datapackage.json'))
  const descriptor = dpjson.resources[0]
  const path_ = path.join(basePath, descriptor.path)
  const error = await t.throws(validateData(descriptor.schema, path_))
  t.true(error[0].toString().includes('Error: Wrong type for header: VIXOpen and value: 17.96'))
})

// ====================================
// validateMetadata function
// ====================================

test('it validateMetadata function works with valid descriptor', async t => {
  const descriptor = {
    name: 'valid-descriptor',
    resources: [
      {
        name: 'name',
        path: 'path'
      }
    ]
  }
  const valid = await validateMetadata(descriptor)
  t.true(valid)
})

test('it returns list of errors if descriptor is invalid', async t => {
  const descriptor = {
    resources: []
  }
  const error = await t.throws(validateMetadata(descriptor))
  t.true(error[0].toString().includes('Array is too short (0), minimum 1'))
})

// ====================================
// Profile class
// ====================================

// Constants

const PROFILES = [
  'data-package'
]

// Tests

PROFILES.forEach(name => {
  test(`Profile.load method for ${name}`, async t => {
    const jsonschema = require(`../lib/schema/${name}.json`)
    const profile = await Profile.load(name)
    t.deepEqual(profile.jsonschema, jsonschema)
  })
})

test('Prfile.load method for remote', async t => {
  const url = 'http://example.com/data-package.json'
  const jsonschema = require('../lib/schema/data-package.json')
  const profile = await Profile.load(url)
  t.deepEqual(profile.name, 'data-package')
  t.deepEqual(profile.jsonschema, jsonschema)
})

test('throw loading bad registry profile', async t => {
  const name = 'bad-data-package'
  const error = await t.throws(Profile.load(name))
  t.true(error.message.includes('profile bad-data-package'))
})

test('throw loading bad remote profile', async t => {
  const name = 'http://example.com/profile.json'
  const error = await t.throws(Profile.load(name))
  t.true(error.toString().includes('Can not retrieve remote profile http://example.com/profile.json'))
})
