const test = require('ava')
const Datapackage = require('datapackage').Datapackage
const urljoin = require('url-join')
const path = require('path')
const sinon = require('sinon')
const run = require('inquirer-test')
const { ENTER } = require('inquirer-test')

const { scanDir, addResource, buildSchema, addFiles, shouldWrite } = require('../lib/init')

const cliPath = path.join(__dirname, '../bin/data-init.js')

test.serial('runs init command with data input', async t => {
  const result = await(run(cliPath, [
    'my-datapackage', ENTER
  ]))
  t.true(result.includes('? Enter Data Package name (scratchpad)'))
  t.true(result.includes('my-datapackage'))
})

test.serial('checks scanDir function', async t => {
  const res = await scanDir('test/fixtures/readdirTest/')
  const exp = {
    files:
     [ 'sample1.csv', 'sample2.json' ],
    dirs: [ 'dir' ]
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
    "name": "second-resource",
    "path": "second-resource.csv",
    "format": "csv",
    "schema": {
      "fields": [
        {
          "description": "",
          "format": "default",
          "name": "a",
          "title": "",
          "type": "string"
        },
        {
          "description": "",
          "format": "default",
          "name": "b",
          "title": "",
          "type": "date"
        },
        {
          "description": "",
          "format": "default",
          "name": "c",
          "title": "",
          "type": "integer"
        }
      ]
    }
  }
  await addResource('second-resource.csv', dpObj)
  t.deepEqual(dpObj.resources[1].descriptor, expResourceDescriptor)
})


test.serial('adding non tabular file', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')
  const expResourceDescriptor = {
    "name": "second-resource-non-tabular",
    "path": "second-resource-non-tabular.json",
    "format": "json"
  }
  await addResource('second-resource-non-tabular.json', dpObj)
  t.deepEqual(dpObj.resources[1].descriptor, expResourceDescriptor)
})


test.serial('how buildSchema works', async t => {
  const res = await buildSchema('test/fixtures/readdirTest/sample1.csv')
  const exp = {
    fields: [
      {
        description: "",
        format: "default",
        name: "number",
        title: "",
        type: "integer"
      },
      {
        description: "",
        format: "default",
        name: "string",
        title: "",
        type: "string"
      },
      {
        description: "",
        format: "default",
        name: "boolean",
        title: "",
        type: "boolean"
      }
    ]
  }
  t.deepEqual(res, exp)
})
