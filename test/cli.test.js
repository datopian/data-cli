// Test the CLI directly
const fs = require('fs')
const path = require('path')

const test = require('ava')
const {spawn} = require('cross-spawn')
const run = require('inquirer-test')

const {version} = require('../package.json')
const cliPath = path.join(__dirname, '../bin/data-init.js')
const {ENTER} = require('inquirer-test')

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



test.after('cleanup', t => {
  const filesToRemove = [
    'sample.csv',
    'finance-vix/datapackage.json',
    'finance-vix/README.md',
    'finance-vix/data/vix-daily.csv'
  ]
  filesToRemove.forEach(fs.unlinkSync)
  fs.rmdirSync('finance-vix/data')
  fs.rmdirSync('finance-vix')
})

test('get command with dataset', async t => {
  const identifier = 'test/fixtures/finance-vix'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "finance-vix"'))
})

test('get command with file', async t => {
  const identifier = 'test/fixtures/sample.csv'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "sample.csv"'))
})

test('runs init command with data input', async t => {
  const result = await (run(cliPath, [
    'my-datapackage', ENTER
  ]))
  t.true(result.includes('? Enter Data Package name (scratchpad)'))
  t.true(result.includes('my-datapackage'))
})

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
  t.true(stdout[1].includes('❒ data [options] <command> <args>'))
})

test('info command with a dataset', async t => {
  const identifier = 'test/fixtures/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('CBOE Volatility Index (VIX)'))
})

test('info command with a file', async t => {
  const identifier = 'test/fixtures/sample.csv'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('File descriptor:'))
})

test('info command with a dataset from GitHub', async t => {
  const identifier = 'https://github.com/datasets/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('CBOE Volatility Index (VIX)'))
})

test('info command with a dataset from DataHub', async t => {
  const identifier = 'https://datahub.io/core/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('CBOE Volatility Index (VIX)'))
})

test('validate command - basic dataset', async t => {
  const path_ = 'test/fixtures/finance-vix/'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

test('validate command - remote basic dataset', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/basic-csv'
  const result = await runcli('validate', url_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

test('validate command - invalid dataset', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/constraints'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 7 type and format mismatch errors on line 3')
})

module.exports = {
  runcli
}
