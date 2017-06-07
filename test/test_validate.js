const test = require('ava')
const validate = require('../lib/validate')
const sinon = require('sinon')

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

test.afterEach(t => {
  console.error.reset()
  console.error = t.context.log
})

test('validateDp function returns false for invalid descriptors, but true for valid', async t => {
  let result = await validate.validateDp(invalidDp1)
  t.false(result)
  result = await validate.validateDp(invalidDp2)
  t.false(result)
  result = await validate.validateDp(invalidDp3)
  t.false(result)
  // now pass valid dp
  result = await validate.validateDp(validDp)
  t.true(result)
})

test.serial('test error messages when descriptor is invalid', async t => {
  // invalidDp1 has 2 validation errors:
  await validate.validateDp(invalidDp1)
  t.true(console.error.calledTwice)
  t.true(console.error.firstCall.args[0].includes("Missing required property: resources"))
  t.true(console.error.secondCall.args[0].includes("String does not match pattern"))

  // reset spy state
  console.error.reset()

  // invalidDp2 has 1 validation error:
  await validate.validateDp(invalidDp2)
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes("Array is too short (0), minimum 1"))

  // reset spy state
  console.error.reset()

  // invalidDp3 has 1 validation error:
  await validate.validateDp(invalidDp3)
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes("Missing required property: name"))
})
