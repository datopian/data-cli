const path = require('path')
const test = require('ava')
const { spawn } = require('cross-spawn')
const { version } = require('../package.json')

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
  t.true(stdout[1].includes('Welcome to the DataHub command line tool.'))
})

test('"data help get" prints help message for get command', async t => {
  const result = await data('help', 'get')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data get'))
})

test('"data get -h --help" prints help message for get command', async t => {
  let result = await data('get', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data get'))

  result = await data('get', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data get'))
})

test('"data help push" prints help message for push command', async t => {
  const result = await data('help', 'push')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data push'))
})

test('"data push -h --help" prints help message for push command', async t => {
  let result = await data('push', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data push'))

  result = await data('push', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data push'))
})

test('"data help config" prints help message for config command', async t => {
  const result = await data('help', 'config')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data config'))
})

test('"data config -h --help" prints help message for config command', async t => {
  let result = await data('config', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data config'))

  result = await data('config', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data config'))
})

test('"data help dp" prints help message for dp command', async t => {
  const result = await data('help', 'dp')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data dp [argument]'))
})


test('"data dp -h --help" prints help message for dp command', async t => {
  const result = await data('dp', '-h')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data dp [argument]'))
})

test('"data dp" if wrong argument given, it prints help message for dp command', async t => {
  const result = await data('dp', 'test')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('data dp [argument]'))
})


test('"data dp norm[alize]" normalizes datapackage.json in the cwd', async t => {
  const result1 = await data('dp', 'norm')
  const result2 = await data('dp', 'normalize')

  const stdout1 = result1.stdout.split('\n')
  t.true(stdout1.length > 1)
  t.true(stdout1[0].includes('Datapackage.json has been normalized'))

  const stdout2 = result2.stdout.split('\n')
  t.true(stdout2.length > 1)
  t.true(stdout2[0].includes('Datapackage.json has been normalized'))
})

test('"data dp normalize test/fixtures/datapackage.json" normalizes datapackage.json with given file path', async t => {
  const result = await data('dp', 'normalize', 'test/fixtures/datapackage.json')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalize'))
})

test('"data dp normalize test/fixtures/" normalizes datapackage.json inside given folder', async t => {
  const result = await data('dp', 'normalize', 'test/fixtures/')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalize'))
})

test('"data dp normalize test/fixtures" normalizes datapackage.json inside given folder', async t => {
  const result = await data('dp', 'normalize', 'test/fixtures')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalize'))
})

function data(...args) {
  return new Promise((resolve, reject) => {
    const command = path.resolve(__dirname, '../bin/data.js')
    const data = spawn(command, args)

    let stdout = ''
    data.stdout.on('data', data => {
      stdout += data
    })

    data.on('error', err => {
      reject(err)
    })

    data.on('close', code => {
      resolve({
        code,
        stdout
      })
    })
  })
}
