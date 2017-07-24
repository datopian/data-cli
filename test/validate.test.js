const test = require('ava')
const {validate, validateMetadata} = require('../lib/validate')

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
