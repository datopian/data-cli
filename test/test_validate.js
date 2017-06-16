const test = require('ava')
const { validate } = require('../lib/validate')
const sinon = require('sinon')
const { data } = require('./data.js')

// descriptor with invalid name and missing resources property
const invalidDp1 = {
  "name": "Invalid Name and no resource property"
}

// descriptor with valid name and with empty resources property
const invalidDp2 = {
  "name": "valid-name",
  "resources": []
}

// descriptor with valid name and resources property, but without resource name
const invalidDp3 = {
  "name": "valid-name",
  "resources": [
    {}
  ]
}

// the simplest valid descriptor
const validDp = {
  "name": "valid-name",
  "resources": [
    {
      "name": "valid-resource-name"
    }
  ]
}

test.beforeEach(t => {
  t.context.log = console.error

  console.error = sinon.spy()
})

test('validateDescriptor function returns array for invalid descriptors, but true for valid', async t => {
  let result = await validate(invalidDp1)
  t.true(result instanceof Array)
  result = await validate(invalidDp2)
  t.true(result)
  result = await validate(invalidDp3)
  t.true(result instanceof Array)
  // now pass valid dp
  result = await validate(validDp)
  t.true(result instanceof Array)
})

test.serial('test error messages when descriptor is invalid', async t => {
  // invalidDp1 validation errors:
  let validation = await validate(invalidDp1)
  t.true(validation[0].includes('Missing required property: resources schema path'))

  // invalidDp2 is valid even there is no resources:
  validation = await validate(invalidDp2)
  t.true(validation)

  // invalidDp3 has 1 validation error:
  validation = await validate(invalidDp3)
  t.true(validation[0].includes('Data does not match any schemas'))
})

test('"data help validate" prints help message', async t => {
  const result = await data('help', 'validate')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Validate a descriptor'))
})
