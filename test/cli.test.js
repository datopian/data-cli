// Test the CLI directly
const fs = require('fs')
const path = require('path')

const test = require('ava')
const {spawn} = require('cross-spawn')
const run = require('inquirer-test')
const {ENTER} = require('inquirer-test')

const {version} = require('../package.json')

const runcli = (...args) => {
  return new Promise((resolve, reject) => {
    const command = path.resolve(__dirname, '../bin/data.js')
    args.push('--test')
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
  let deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        let curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      })
      fs.rmdirSync(path);
    }
  }
  deleteFolderRecursive('finance-vix')
  deleteFolderRecursive('test/small-dataset-100kb')
  deleteFolderRecursive('test/medium-dataset-1mb')
  deleteFolderRecursive('test/big-dataset-10mb')
  deleteFolderRecursive('test/private-cli-test')
  fs.unlinkSync('sample.csv')
  fs.unlinkSync('sample-1-sheet.xls')

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


// =======================================
// DATA-CLI GET

test('get command with local dataset', async t => {
  const identifier = 'test/fixtures/finance-vix'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "finance-vix"'))
})

test('get command with local file', async t => {
  const identifier = 'test/fixtures/sample.csv'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "sample.csv"'))
})

// QA tests [Get: Small dataset from DataHub]

test('get command with small dataset from DataHub', async t => {
  const identifier = 'https://datahub.io/test/small-dataset-100kb'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "test/small-dataset-100kb"'))
  // t.true(fs.)
})

// end of [Get: Small dataset from DataHub]

// QA tests [Get: Medium dataset from DataHub]

test('get command with medium dataset from DataHub', async t => {
  const identifier = 'https://datahub.io/test/medium-dataset-1mb'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "test/medium-dataset-1mb"'))
})

// end of [Get: Meduim dataset from DataHub]

// QA tests [Get: Big dataset from DataHub]

test('get command with big dataset from DataHub', async t => {
  const identifier = 'https://datahub.io/test/big-dataset-10mb'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "test/big-dataset-10mb"'))
})

// end of [Get: Big dataset from DataHub]

// QA tests [Get: get excel file]

test('get command with excel file', async t => {
  const identifier = 'https://github.com/frictionlessdata/test-data/blob/master/files/excel/sample-1-sheet.xls'
  const result = await runcli('get', identifier)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "sample-1-sheet.xls"'))
})

// end of [Get: get excel file]

// QA tests [Get: get private dataset]

test('get command with private dataset', async t => {
  const identifier = 'https://datahub.io/test/private-cli-test'
  // Note that token for test user is set in env var. First we pass wrong token
  // as an argument and expect 404 or 403:
  const token = 'non-owner-token'
  let result = await runcli('get', identifier, `--token=${token}`)
  let stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Not Found or Forbidden'))

  // Now use correct token from env var:
  result = await runcli('get', identifier)
  stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('Time elapsed:'))
  t.true(stdout[1].includes('Dataset/file is saved in "test/private-cli-test"'))
  t.true(fs.existsSync('test/private-cli-test/datapackage.json'))
})


// =======================================
// CLI commands: validate, cat, info, init

test('runs init command with data input', async t => {
  const cliPath = path.join(__dirname, '../bin/data-init.js')
  const result = await run([cliPath], ['my-datapackage', ENTER])
  t.true(result.includes('? Enter Data Package name (scratchpad)'))
  t.true(result.includes('my-datapackage'))
})

// QA tests [Info: basic dataset]

test('Info: basic dataset', async t => {
  let identifier = 'test/fixtures/test-data/packages/basic-csv'
  let result = await runcli('info', identifier)
  let stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('# basic-csv'))
  t.true(stdout[9].includes('comma-separated'))

  identifier = 'https://github.com/frictionlessdata/test-data/tree/master/packages/basic-csv'
  result = await runcli('info', identifier)
  stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('# basic-csv'))
  t.true(stdout[9].includes('comma-separated'))
})

// end of [Info: basic dataset]

// QA tests [Info: dataset with multiple resources]

test('Info: dataset with multiple resources', async t => {
  let identifier = 'test/fixtures/test-data/packages/different-separators'
  let result = await runcli('info', identifier)
  let stdout = result.stdout.split('\n')
  let hasCaretsResource = stdout.find(item => item.includes('carets'))
  let hasCommaResource = stdout.find(item => item.includes('comma'))
  t.truthy(hasCaretsResource)
  t.truthy(hasCommaResource)

  identifier = 'https://github.com/frictionlessdata/test-data/tree/master/packages/different-separators'
  result = await runcli('info', identifier)
  stdout = result.stdout.split('\n')
  hasCaretsResource = stdout.find(item => item.includes('carets'))
  hasCommaResource = stdout.find(item => item.includes('comma'))
  t.truthy(hasCaretsResource)
  t.truthy(hasCommaResource)
})

// end if [Info: dataset with multiple resources]

// QA tests [Info: basic CSV]

test('Info: basic CSV', async t => {
  let identifier = 'test/fixtures/test-data/files/csv/100kb.csv'
  let result = await runcli('info', identifier)
  let stdout = result.stdout.split('\n')
  let hasDialect = stdout.find(item => item.includes('dialect'))
  let hasSchema = stdout.find(item => item.includes('schema'))
  let hasEncodings = stdout.find(item => item.includes('encoding'))
  let hasCreatedDate = stdout.find(item => item.includes('created'))
  let hasValueInTheTenthRow = stdout.find(item => item.includes('Sharlene'))
  let hasValueInTheEleventhRow = stdout.find(item => item.includes('Misti'))
  t.truthy(hasDialect)
  t.truthy(hasSchema)
  t.truthy(hasEncodings)
  t.falsy(hasCreatedDate)
  t.truthy(hasValueInTheTenthRow)
  t.falsy(hasValueInTheEleventhRow)
})

// end of [Info: basic CSV]

// QA tests [Info: non-tabular file]

test('Info: non-tabular file', async t => {
  let identifier = 'test/fixtures/test-data/files/other/sample.pdf'
  let result = await runcli('info', identifier)
  let stdout = result.stdout.split('\n')
  let hasName = stdout.find(item => item.includes('name'))
  let hasFormat = stdout.find(item => item.includes('format'))
  let hasPath = stdout.find(item => item.includes('path'))
  let hasDialect = stdout.find(item => item.includes('dialect'))
  t.truthy(hasName)
  t.truthy(hasFormat)
  t.truthy(hasPath)
  t.falsy(hasDialect)

  identifier = 'https://github.com/frictionlessdata/test-data/raw/master/files/other/sample.pdf'
  result = await runcli('info', identifier)
  stdout = result.stdout.split('\n')
  hasName = stdout.find(item => item.includes('name'))
  hasFormat = stdout.find(item => item.includes('format'))
  hasPath = stdout.find(item => item.includes('path'))
  hasDialect = stdout.find(item => item.includes('dialect'))
  t.truthy(hasName)
  t.truthy(hasFormat)
  t.truthy(hasPath)
  t.falsy(hasDialect)
})

// QA tests [Info: from datahub and github]

test('info command with a dataset from GitHub', async t => {
  const identifier = 'https://github.com/datasets/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  const hasReadme = stdout.find(item => item.includes('CBOE Volatility Index (VIX) time-series dataset including'))
  const hasResource = stdout.find(item => item.includes('vix-daily'))
  t.truthy(hasReadme)
  t.truthy(hasResource)
})

test('info command with a dataset from DataHub', async t => {
  const identifier = 'https://datahub.io/core/finance-vix'
  const result = await runcli('info', identifier)
  const stdout = result.stdout.split('\n')
  const hasReadme = stdout.find(item => item.includes('CBOE Volatility Index (VIX) time-series dataset including'))
  const hasResource = stdout.find(item => item.includes('vix-daily'))
  t.truthy(hasReadme)
  t.truthy(hasResource)
})

// end of [Info: from datahub and github]

// QA tests [Validate: basic csv resource]

test('validate command - basic dataset', async t => {
  const path_ = 'test/fixtures/test-data/packages/basic-csv'
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

// end of [Validate: basic csv resource]

// QA tests [Validate: non-tabular resource LOCALLY]

test('validate command - non-tabular resource', async t => {
  const path_ = 'test/fixtures/test-data/packages/non-tabular-resource'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

test('validate command - remote dataset with non-tabular resource', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/non-tabular-resource'
  const result = await runcli('validate', url_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

// end of [Validate: non-tabular resource LOCALLY]

// QA tests [Validate: remote resource]

test('validate command - remote resource', async t => {
  const path_ = 'test/fixtures/test-data/packages/remote-csv'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

test('validate command - remote dataset with remote resource', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/remote-csv'
  const result = await runcli('validate', url_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

// end of [Validate: remote resource]

// QA tests [Validate: csv with different separators]

test('validate command - csv with different separators', async t => {
  const path_ = 'test/fixtures/test-data/packages/different-separators'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

test('validate command - remote dataset with csv with different separators', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/different-separators'
  const result = await runcli('validate', url_)
  const stdout = result.stdout.split('\n')
  t.is(stdout[0], 'Your Data Package is valid!')
})

// end of [Validate: csv with different separators]

// QA tests [Validate: invalid path to resource]

test('validate command - invalid local path', async t => {
  const path_ = 'test/fixtures/test-data/packages/invalid-local-path'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('> Error! ENOENT: no such file or directory'))
})

// end of [Validate: invalid path to resource]

// QA tests [Validate: invalid remote path to resource]

test('validate command - invalid remote path for resource', async t => {
  const path_ = 'test/fixtures/test-data/packages/invalid-remote-path'
  const result = await runcli('validate', path_)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('> Error! Request failed with status code 404'))
})

test('validate command - remote dataset with invalid remote path for resource', async t => {
  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/invalid-remote-path'
  const result = await runcli('validate', url_)
  const stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('> Error! Request failed with status code 404'))
})

// end of [Validate: invalid remote path to resource]

// QA tests [Validate: csv with different field types, formats and constraints]

test('validate command - wrong constraints', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/constraints'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 7 type and format mismatch errors on line 3')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/constraints'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 7 type and format mismatch errors on line 3')
})

test('validate command - wrong "date" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/date'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 2 type and format mismatch errors on line 3')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/date'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 2 type and format mismatch errors on line 3')
})

test('validate command - wrong "datetime" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/datetime'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/datetime'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')
})

test('validate command - wrong "string" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/string'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/string'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')
})

test('validate command - wrong "time" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/time'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/time'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 3 type and format mismatch errors on line 3')
})

test('validate command - wrong "year" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/year'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 1 type and format mismatch errors on line 2')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/year'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 1 type and format mismatch errors on line 2')
})

test('validate command - wrong "yearmonth" type/format', async t => {
  const path_ = 'test/fixtures/test-data/packages/types-formats-and-constraints/yearmonth'
  let result = await runcli('validate', path_)
  let stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 1 type and format mismatch errors on line 2')

  const url_ = 'https://github.com/frictionlessdata/test-data/tree/master/packages/types-formats-and-constraints/yearmonth'
  result = await runcli('validate', url_)
  stdout = result.stdout.split('\n')
  t.is(stdout[0], '> Error! There are 1 type and format mismatch errors on line 2')
})

// end of [Validate: csv with different field types, formats and constraints]

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

test('cat command - local tsv file', async t => {
  const path_= 'test/fixtures/test-data/files/csv/separators/tab.tsv'
  const results = await runcli('cat', path_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[1].includes('number'))
})

test('cat command - remote tsv file', async t => {
  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/separators/tab.tsv'
  const results = await runcli('cat', url_)
  const stdout = results.stdout.split('\n')
  t.true(stdout[1].includes('number'))
})

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

module.exports = {
  runcli
}
