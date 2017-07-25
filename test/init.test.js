const path = require('path')
const test = require('ava')
const Datapackage = require('datapackage').Datapackage
const run = require('inquirer-test')
const {ENTER} = require('inquirer-test')

const {scanDir, addResource, buildSchema} = require('../lib/init')

const cliPath = path.join(__dirname, '../bin/data-init.js')

test.serial('runs init command with data input', async t => {
  const result = await (run(cliPath, [
    'my-datapackage', ENTER
  ]))
  t.true(result.includes('? Enter Data Package name (scratchpad)'))
  t.true(result.includes('my-datapackage'))
})

test.serial('checks scanDir function', async t => {
  const res = await scanDir('test/fixtures/readdirTest/')
  const exp = {
    files:
     ['sample1.csv', 'sample2.json'],
    dirs: ['dir']
  }
  t.deepEqual(res, exp)
})

test.serial('adding resources - addResource function', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')

  t.true(dpObj.resources.length === 1)
  await addResource('second-resource.csv', dpObj)
  t.true(dpObj.resources.length === 2)
  t.is(dpObj.resources[1].name, 'second-resource')
})

test.serial('adding tabular data should include schema', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')
  const expResourceDescriptor = {
    name: 'second-resource',
    path: 'second-resource.csv',
    format: 'csv',
    schema: {
      fields: [
        {
          format: 'default',
          name: 'a',
          type: 'string'
        },
        {
          format: 'default',
          name: 'b',
          type: 'date'
        },
        {
          format: 'default',
          name: 'c',
          type: 'integer'
        }
      ]
    }
  }
  await addResource('second-resource.csv', dpObj)
  t.deepEqual(dpObj.resources[1].descriptor.schema.fields, expResourceDescriptor.schema.fields)
})

test.serial('adding non tabular file', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')
  const expResourceDescriptor = {
    name: 'second-resource-non-tabular',
    path: 'second-resource-non-tabular.json',
    format: 'json'
  }
  await addResource('second-resource-non-tabular.json', dpObj)
  t.deepEqual(dpObj.resources[1].descriptor, expResourceDescriptor)
})

test.serial('how buildSchema works', async t => {
  const res = await buildSchema('test/fixtures/readdirTest/sample1.csv')
  const exp = {
    fields: [
      {
        format: 'default',
        name: 'number',
        type: 'integer'
      },
      {
        format: 'default',
        name: 'string',
        type: 'string'
      },
      {
        format: 'default',
        name: 'boolean',
        type: 'boolean'
      }
    ]
  }
  t.deepEqual(res.fields, exp.fields)
})
