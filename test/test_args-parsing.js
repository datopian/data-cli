const path = require('path')
const test = require('ava')
const { spawn } = require('cross-spawn')

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
