require("babel-core/register")
require("babel-polyfill")
const test = require('ava')
const { version } = require('../package.json')
const { data } = require('./data.js')

test('"data -v --version" prints version', async t => {
  let result = await data('-v')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes(`Version: ${version}`))

  result = await data('--version')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes(`Version: ${version}`))
})

test('"data help" prints help message', async t => {
  const result = await data('help')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Welcome to the DataHub command line tool!'))
})

test('"data help get" prints help message for get command', async t => {
  const result = await data('help', 'get')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))
})

test('"data get -h --help" prints help message for get command', async t => {
  let result = await data('get', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))

  result = await data('get', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Get a Data Package from DataHub'))
})

test('"data help push" prints help message for push command', async t => {
  const result = await data('help', 'push')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))
})

test('"data push -h --help" prints help message for push command', async t => {
  let result = await data('push', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))

  result = await data('push', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))
})

test('"data help config" prints help message for config command', async t => {
  const result = await data('help', 'config')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))
})

test('"data config -h --help" prints help message for config command', async t => {
  let result = await data('config', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))

  result = await data('config', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Set configurations'))
})

test('"data help purge" prints help message for purge command', async t => {
  const result = await data('help', 'purge')
  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))
})

test('"data purge -h --help" prints help message for purge command', async t => {
  let result = await data('purge', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))

  result = await data('purge', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Purge a Data Package in DataHub'))
})

test('"data help norm[alize]" prints help message for dp command', async t => {
  const result = await data('help', 'normalize')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Normalize a descriptor (datapackage.json)'))
})


test('"data norm[alize] -h --help" prints help message for dp command', async t => {
  const result = await data('normalize', '-h')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Normalize a descriptor (datapackage.json)'))
})


test('"data norm[alize] test/fixtures/datapackage.json" normalizes datapackage.json with given file path', async t => {
  const result = await data('normalize', 'test/fixtures/datapackage.json')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalized'))
})

test('"data norm[alize] test/fixtures/" normalizes datapackage.json inside given folder', async t => {
  const result = await data('normalize', 'test/fixtures/')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalized'))
})

test('"data norm[alize] test/fixtures" normalizes datapackage.json inside given folder', async t => {
  const result = await data('normalize', 'test/fixtures')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalized'))
})
