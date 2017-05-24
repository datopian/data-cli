const get = require('../lib/index.js').get
const assert = require('assert')

describe('basic test for lib directory', () => {
  it('does not fail!', () => {
    get()
    assert.equal(1, 1)
  })
})
