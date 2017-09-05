const fs = require('fs')

const test = require('ava')
const nock = require('nock')
const {Dataset} = require('data.js')

const {get} = require('../lib/get.js')
const {runcli} = require('./cli.test.js')

nock('https://test.com')
  .get('/finance-vix/datapackage.json')
  .replyWithFile(200, __dirname + '/fixtures/finance-vix/datapackage.json')
  .get('/finance-vix/README.md')
  .replyWithFile(200, __dirname + '/fixtures/finance-vix/README.md')

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

test('get function', async t => {
  const identifier = 'https://test.com/finance-vix'
  const dataset = await Dataset.load(identifier)
  t.is(dataset.resources.length, 1)
  const res = await get(dataset)
  // Now returned res has length of 3 due to datapackage.json and readme
  t.is(res.length, 3)
})

// =====================
// CLI tests
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
