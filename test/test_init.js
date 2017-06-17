const test = require('ava')
const {scanDir, addResource, buildSchema} = require('../lib/init.js')
const sinon = require('sinon')
const Datapackage = require('datapackage').Datapackage
const util = require('util')


test('checks scanDir object', async t => {
  const res = await scanDir('test/fixtures/readdirTest/')
  const exp = {
    files:
     [ 'sample1.csv',
       'sample2.json' ],
    dirs: []
  }
  t.deepEqual(res, exp)
})


test('adding resources', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')

  t.true(dpObj.resources.length === 1)
  await addResource(dpObj._basePath+'/'+'second-resource.csv', dpObj)
  t.true(dpObj.resources.length === 2)
  t.is(dpObj.resources[1].name, 'second-resource')
})


test('adding tabular data', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')
  await addResource('second-resource.csv', dpObj)
  t.true(dpObj.resources.length === 2)
  //console.log(util.inspect(dpObj.resources[1].name, {showHidden: false, depth: null}))
  t.is(dpObj.resources[1].name, 'second-resource')
})


test('adding non tabular file', async t => {
  const dpObj = await new Datapackage('test/fixtures/dp-test/datapackage.json')
  await addResource('second-resource-non-tabular.json', dpObj)
  t.true(dpObj.resources.length === 2)
  t.is(dpObj.resources[1].name, 'second-resource-non-tabular')
})


test('checks for schema', async t => {
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
