// Test the CLI directly
const path = require('path')

const test = require('ava')
const {spawn} = require('cross-spawn')

const {version} = require('../package.json')

const runcli = (...args) => {
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

// ==========
// The basics

test('"data -v --version" prints version', async t => {
  let result = await runcli('-v')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes(`${version}`))

  result = await runcli('--version')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes(`${version}`))
})

test('"data help" prints help message', async t => {
  const result = await runcli('help')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('  ■ data [options] <command> <args>'))
})

module.exports = {
  runcli
}
