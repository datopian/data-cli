const test = require('ava')
const sinon = require('sinon')

const { Resource } = require('../lib/utils/data')
const { dumpers } = require('../lib/cat')

test.beforeEach(t => {
  t.context.log = console.log
  console.log = sinon.spy()
})

test('dump_ascii works', async t => {
  const resource = Resource.load('test/fixtures/sample.csv')
  await dumpers['ascii'](resource)
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes('number'))
})
