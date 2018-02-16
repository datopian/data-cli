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

// QA tests [Cat: basic csv]

test('cat command - basic behaviour', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/all-schema-types.csv'
  const results = await runcli('cat', path_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[3].includes('│ 1.0  │'))
})

test('cat command - remote csv file', async t => {
  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/all-schema-types.csv'
  const results = await runcli('cat', url_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[3].includes('│ 1.0  │'))
})

test('cat command - remote non tabular file', async t => {
  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/other/sample.txt'
  const results = await runcli('cat', url_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[1].includes('> Error! We do not have a parser for that format: txt'))
})

test('cat command - non-existing path', async t => {
  const path_ = 'non/existing/path'
  const results = await runcli('cat', path_)
  const stdout = results.stdout.split('\n')
  t.is(stdout[0], '> Error! ENOENT: no such file or directory, open \'non/existing/path\'')
})

test('cat command - URL that returns 404', async t => {
  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/other/sampl.csv'
  const results = await runcli('cat', url_)
  const stdout = results.stdout.split('\n')
  t.is(stdout[0], '> Error! Provided URL is invalid')
  t.is(stdout[1], '> Error! Not Found')
})

// end of [Cat: basic csv]

// QA tests [Cat: different separators]

test('cat command - files with different separator', async t => {
  // Local files:
  let path_ = 'test/fixtures/test-data/files/csv/separators/semicolon.csv'
  let results = await runcli('cat', path_)
  let stdout = results.stdout.split('\n')
  t.false(stdout[1].includes(';'))
  t.true(stdout[1].includes('number'))

  path_ = 'test/fixtures/test-data/files/csv/separators/carets.csv'
  results = await runcli('cat', path_)
  stdout = results.stdout.split('\n')
  t.false(stdout[1].includes('^'))
  t.true(stdout[1].includes('number'))

  // Remote files:
  let url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/separators/semicolon.csv'
  results = await runcli('cat', url_)
  stdout = results.stdout.split('\n')
  t.false(stdout[1].includes(';'))
  t.true(stdout[1].includes('number'))

  url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/separators/carets.csv'
  results = await runcli('cat', url_)
  stdout = results.stdout.split('\n')
  t.false(stdout[1].includes('^'))
  t.true(stdout[1].includes('number'))
})

// end of [Cat: different separators]

// QA test [Cat: different encodings]

test.skip('cat command - different encodings', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/encodings/iso8859.csv'
  let results = await runcli('cat', path_)
  let stdout = results.stdout.split('\n')
  t.true(stdout[3].includes('Réunion'))

  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/encodings/western-macos-roman.csv'
  results = await runcli('cat', url_)
  stdout = results.stdout.split('\n')
  t.true(stdout[3].includes('Réunion'))
})

// end of [Cat: different encodings]

test('cat command - inconsistent columns', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/inconsistent-column-number.csv'
  const results = await runcli('cat', path_)
  const stdout = results.stdout.split('\n')
  t.is(stdout[0], '> Error! Number of columns is inconsistent on line 3')
})

test('cat command - remote excel file', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/raw/master/files/excel/sample-1-sheet.xls'
  const results = await runcli('cat', url_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[1].includes('number'))
})
