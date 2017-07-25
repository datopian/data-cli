const path = require('path')
const test = require('ava')
const nock = require('nock')

const {validate, validateMetadata, Profile} = require('../lib/validate')

nock('http://example.com')
  .persist()
  .get('/data-package.json')
  .replyWithFile(200, path.join(__dirname, '../lib/schema/data-package.json'))
  .get('/profile.json')
  .replyWithError(400)

test('validate function', async t => {
  // Returns true if valid
  const descriptor = {
    name: 'valid-descriptor',
    resources: []
  }
  const valid = await validate(descriptor)
  t.true(valid)

  const invalidDescriptor = {
    resources: []
  }
  const invalid = await validate(invalidDescriptor)
  t.true(invalid[0].toString().includes('Missing required property: name'))
})

test('it validateMetadata function works with valid descriptor', async t => {
  const descriptor = {
    name: 'valid-descriptor',
    resources: []
  }
  const valid = await validateMetadata(descriptor)
  t.true(valid)
})

test('it returns list of errors if descriptor is invalid', async t => {
  const descriptor = {
    resources: []
  }
  const error = await t.throws(validateMetadata(descriptor))
  t.true(error[0].toString().includes('Missing required property: name'))
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
