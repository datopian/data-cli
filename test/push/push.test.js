// These tests are run only on tagged commits

const test = require('ava')
const clipboardy = require('clipboardy')

const {runcli} = require('../cli.test.js')


// =====================
// DATA-CLI PUSH correct

// QA tests [pushing valid CSV file]

test.serial('push command succeeds with regular CSV file', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/separators/comma.csv'
  const args = '--name=comma-separated'
  const result = await runcli('push', path_, args)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/comma-separated/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/comma-separated/v/'))
})

// end of [pushing valid CSV file]

test.serial('push --public', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/separators/comma.csv'
  const args = ['--name=public-test', '--public', '--debug']
  const result = await runcli('push', path_, ...args)

  t.truthy(result.stdout.includes('"findability": "published"'))
})

// QA tests [pushing valid dataset from path]

test.serial('push command succeeds for valid dataset', async t => {
  const path_ = 'test/fixtures/test-data/packages/basic-csv'
  const result = await runcli('push', path_)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/basic-csv/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/basic-csv/v/'))
})

// end of [pushing valid dataset from path]

// QA tests [pushing valid dataset from working directory]
test.serial('pushing valid dataset from working directory', async t =>{
  const path_ = 'test/fixtures/test-data/packages/basic-csv'
  const usualWorkingDir = process.cwd()
  process.chdir(path_)
  console.log('Working directory changed: ' + process.cwd())
  // push test
  const result = await runcli('push')
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/basic-csv/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/basic-csv/v/'))
  // change working dir to default, so other tests will not fail
  process.chdir(usualWorkingDir)
  console.log('Working directory restored: ' + process.cwd())
})

// QA tests [pushing multiple CSV files together] - should push only one file and show a WARNING message
// https://datahub.io/test/zero/v/87
test.serial.failing('pushing multiple CSV files Warning message', async t => {
  const path_ = 'test/fixtures/test-data/files/csv/separators/comma.csv'
  const path2_ = 'test/fixtures/test-data/files/csv/separators/colon.csv'
  const args = '--name=comma-separated'
  const result = await runcli('push', path_, path2_, args)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/comma-separated/v/'))
  const hasWarningMessage = stdout.find(item => item.includes(`Warning: pushing only the ${path_} file.`))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  t.truthy(hasWarningMessage)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/comma-separated/v/'))
})


// QA tests [pushing valid dataset with path to datapackage.json]

test.serial('push command succeeds for valid dataset with path to dp.json', async t => {
  const path_ = 'test/fixtures/test-data/packages/basic-csv/datapackage.json'
  const result = await runcli('push', path_)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/basic-csv/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/basic-csv/v/'))
})

// end of [pushing valid dataset with path to datapackage.json]

// QA tests [pushing valid CSV from URL]

test.serial('push command succeeds with regular CSV file from URL', async t => {
  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/csv/separators/comma.csv'
  const args = '--name=comma-separated'
  const result = await runcli('push', url_, args)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/comma-separated/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/comma-separated/v/'))
})

// end of [pushing valid CSV from URL]


// ========================
// Invalid metadata or data

// QA tests [Push: Invalid datapackage.json]

test('push command fails with invalid JSON descriptor', async t => {
  let path_ = 'test/fixtures/test-data/packages/invalid-json-single-quotes'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  let hasErrorMsg = stdout.find(item => item.includes('> Error! Unexpected token \' in JSON at position 27'))
  t.truthy(hasErrorMsg)
  // Suggests running validate command:
  const hasSuggestionMsg = stdout.find(item => item.includes('> \'data validate\' to check your data.'))
  t.truthy(hasSuggestionMsg)

  path_ = 'test/fixtures/test-data/packages/invalid-json-missing-comma'
  result = await runcli('push', path_)
  stdout = result.stdout.split('\n')
  hasErrorMsg = stdout.find(item => item.includes('> Error! Unexpected string in JSON at position 113'))
  t.truthy(hasErrorMsg)
})

// end of [Push: Invalid datapackage.json]

// QA tests [Push: Invalid descriptor metadata]

test('push command fails with descriptor validation error', async t => {
  let path_ = 'test/fixtures/test-data/packages/invalid-descriptor'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  const hasErrorMsg = stdout.find(item => item.includes('Descriptor validation error:'))
  t.truthy(hasErrorMsg)
  let hasErrorDetails = stdout.find(item => item.includes('String does not match pattern: ^([-a-z0-9._/])+$'))
  t.truthy(hasErrorDetails)
  hasErrorDetails = stdout.find(item => item.includes('at \"/name\" in descriptor'))
  t.truthy(hasErrorDetails)
})

// end of [Push: Invalid descriptor metadata]

// QA tests [Push: Missing descriptor]

test('push command fails if descriptor is missing', async t => {
  let path_ = 'test/fixtures/test-data/packages'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  const hasErrorMsg = stdout.find(item => item.includes('> Error! No datapackage.json at destination.'))
  t.truthy(hasErrorMsg)
  let suggestsToDoValidate = stdout.find(item => item.includes('data validate'))
  let suggestsToDoInit = stdout.find(item => item.includes('data init'))
  t.truthy(suggestsToDoValidate)
  t.truthy(suggestsToDoInit)
})

// end of [Push: Missing descriptor]

// QA tests [Push: pushing remote data package]

test('push command fails for remote datasets', async t => {
  let path_ = 'https://github.com/frictionlessdata/test-data/blob/master/packages/basic-csv/datapackage.json'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  const hasErrorMsg = stdout.find(item => item.includes('Error: You can push only local datasets.'))
  t.truthy(hasErrorMsg)
})

// end of [Push: pushing remote data package]

// QA tests [Push: pushing valid dataset with remote resource]

test('push command succeeds for valid dataset with remote resource', async t => {
  let path_ = 'test/fixtures/test-data/packages/remote-csv'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/remote-resource/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/remote-resource/v/'))
})

// end of [Push: pushing valid dataset with remote resource]

// QA tests [Pushing invalid CSV file (irrespective of schema)]
// Also includes [pushing invalid CSV from URL ]

test.failing('push command fails for invalid local CSV file', async t => {
  const path_ = 'test/fixtures/test-data/packages/invalid-data/extra-column.csv'
  const args = '--name=extra-column'
  const result = await runcli('push', path_, args)
  const stdout = result.stdout.split('\n')
  const hasErrorMsg = stdout.find(item => item.includes('> Error! Number of columns is inconsistent on line 2'))
  t.truthy(hasErrorMsg)
})

// end of [Pushing invalid CSV file (irrespective of schema)]

// QA tests [Pushing packaged invalid CSV file (irrespective of schema)]

test.serial('push command succeeds with packaged invalid CSV', async t => {
  const path_ = 'test/fixtures/test-data/packages/invalid-data'
  const result = await runcli('push', path_)
  const stdout = result.stdout.split('\n')
  const hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  const hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/basic-csv/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  const whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/basic-csv/v/'))
})

// end of [Pushing packaged invalid CSV file (irrespective of schema)]

// QA tests [Push non existing file]

test('push command fails for non-existing file', async t => {
  let path_ = 'non-existing.csv'
  let result = await runcli('push', path_)
  let stdout = result.stdout.split('\n')
  const hasErrorMsg = stdout.find(item => item.includes('> Error! ENOENT: no such file or directory, lstat \'non-existing.csv\''))
  t.truthy(hasErrorMsg)
})

// end of [Push non existing file]

// QA tests [pushing empty but correct files]

test('push command for empty files: no ext, html, txt, json', async t => {
  let path_ = 'test/fixtures/test-data/files/empty-files/empty'
  let args = '--name=empty-no-extension'
  let result = await runcli('push', path_, args)
  let stdout = result.stdout.split('\n')
  let hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  let hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/empty-no-extension/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/empty-files/empty.html'
  args = '--name=empty-html'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/empty-html/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  let whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/empty-html/v/'))

  path_ = 'test/fixtures/test-data/files/empty-files/empty.txt'
  args = '--name=empty-txt'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/empty-txt/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/empty-files/empty.json'
  args = '--name=empty-json'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/empty-json/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/empty-json/v/'))
})

test('push command fails for empty files tabular files such as csv,xls', async t => {
  let path_ = 'test/fixtures/test-data/files/empty-files/empty.csv'
  let args = '--name=empty-csv'
  let result = await runcli('push', path_, args)
  let stdout = result.stdout.split('\n')
  let hasErrorMsg = stdout.find(item => item.includes('tabular file is invalid: test/fixtures/test-data/files/empty-files/empty.csv'))
  t.truthy(hasErrorMsg)

  path_ = 'test/fixtures/test-data/files/empty-files/empty.xls'
  result = await runcli('push', path_, args)
  args = '--name=empty-xls'
  stdout = result.stdout.split('\n')
  hasErrorMsg = stdout.find(item => item.includes('You cannot push an empty sheet. Please, add some data and try again.'))
  t.truthy(hasErrorMsg)
})

// end of [pushing empty but correct files]

// QA tests [pushing 0 bytes files]

test('push command fails for zero byte files', async t => {
  let path_ = 'test/fixtures/test-data/files/zero-files/zero'
  let args = '--name=zero'
  let result = await runcli('push', path_, args)
  let stdout = result.stdout.split('\n')
  let hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  let hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/zero/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/zero-files/zero.csv'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  t.true(stdout[0].includes('> Error! tabular file is invalid:'))

  path_ = 'test/fixtures/test-data/files/zero-files/zero.html'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/zero/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/zero-files/zero.txt'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/zero/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/zero-files/zero.json'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/zero/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)

  path_ = 'test/fixtures/test-data/files/zero-files/zero.xls'
  result = await runcli('push', path_, args)
  stdout = result.stdout.split('\n')
  let hasErrorMsg = stdout.find(item => item.includes('You can not push empty files, please add some data and try again'))
  t.truthy(hasErrorMsg)
})

// end of [pushing 0 bytes files]


// ==========
// Formatting

// QA tests [pushing valid CSV with force formatting wrong extention (from path and URl)]

test.serial('push command succeeds for CSV with wrong ext but force formatting', async t => {
  const path_ = 'test/fixtures/test-data/files/wrong-extension-files/comma.txt'
  let argName = '--name=comma-separated'
  let argFormat = '--format=csv'
  let result = await runcli('push', path_, argName, argFormat)
  let stdout = result.stdout.split('\n')
  let hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  let hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/comma-separated/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  let whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/comma-separated/v/'))

  const url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/wrong-extension-files/comma.txt'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/comma-separated/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/comma-separated/v/'))
})

// end of [pushing valid CSV with force formatting wrong extention (from path and URl)]

// QA tests [pushing valid XLS and XLSX with force formatting]

test('push command succeeds for Excel with wrong ext but force formatting', async t => {
  let path_ = 'test/fixtures/test-data/files/wrong-extension-files/sample-1-sheet.txt'
  let argName = '--name=sample-excel-with-force-formatting'
  let argFormat = '--format=xls'
  let result = await runcli('push', path_, argName, argFormat)
  let stdout = result.stdout.split('\n')
  let hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  let hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/sample-excel-with-force-formatting/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  let whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/sample-excel-with-force-formatting/v/'))

  path_ = 'test/fixtures/test-data/files/wrong-extension-files/sample-1-sheet.pdf'
  argFormat = '--format=xlsx'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasPublishedMessage = stdout.find(item => item.includes('your data is published!'))
  hasURLtoShowcase = stdout.find(item => item.includes('https://datahub.io/test/sample-excel-with-force-formatting/v/'))
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/sample-excel-with-force-formatting/v/'))
})

// end of [pushing valid XLS and XLSX with force formatting]

// QA test [pushing not CSV with force formatting]

test('push command fails for non-CSV with force formatting', async t => {
  let path_ = 'test/fixtures/test-data/files/excel/sample-1-sheet.xls'
  const argName = '--name=not-csv-as-csv'
  const argFormat = '--format=csv'
  let result = await runcli('push', path_, argName, argFormat)
  let stdout = result.stdout.split('\n')
  let hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)

  let url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/excel/sample-1-sheet.xls'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)

  path_ = 'test/fixtures/test-data/files/excel/sample-1-sheet.xlsx'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)

  url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/excel/sample-1-sheet.xlsx'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)
})

// end of [pushing not CSV with force formatting]

// QA test [pushing not CSV with force formatting (non tabular )]

test('push command fails for non-CSV (non-tabular) files with force formatting', async t => {
  let path_ = 'test/fixtures/test-data/files/other/sample.json'
  const argName = '--name=not-csv-as-csv'
  const argFormat = '--format=csv'
  let result = await runcli('push', path_, argName, argFormat)
  let stdout = result.stdout.split('\n')
  let hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)

  let url_ = 'https://raw.githubusercontent.com/frictionlessdata/test-data/master/files/other/sample.json'
  result = await runcli('push', path_, argName, argFormat)
  stdout = result.stdout.split('\n')
  hasExpectedErrorMsg = stdout.find(item => item.includes('> Error! tabular file is invalid'))
  t.truthy(hasExpectedErrorMsg)
})

// end of [pushing not CSV with force formatting (non tabular )]


// ===========
// Excel files

// QA test [pushing excel file with 1 sheet]

test.serial('push command succeeds for simple Excel with 1 sheet', async t => {
  let path_ = 'test/fixtures/test-data/files/excel/sample-1-sheet.xls'
  const argName = '--name=test-excel-1-sheet'
  let result = await runcli('push', path_, argName, '--debug')
  // Check what's printed in console while in debug mode, e.g., if schema is included:
  let hasSchemaForFirstSheet = result.stdout.includes('"name": "number"')
  t.truthy(hasSchemaForFirstSheet)
  let hasPublishedMessage = result.stdout.includes('your data is published!')
  let hasURLtoShowcase = result.stdout.includes('https://datahub.io/test/test-excel-1-sheet/v/')
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  let whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/test-excel-1-sheet/v/'))

  path_ = 'test/fixtures/test-data/files/excel/sample-1-sheet.xlsx'
  result = await runcli('push', path_, argName, '--debug')
  hasSchemaForFirstSheet = result.stdout.includes('"name": "number"')
  t.truthy(hasSchemaForFirstSheet)
  hasPublishedMessage = result.stdout.includes('your data is published!')
  hasURLtoShowcase = result.stdout.includes('https://datahub.io/test/test-excel-1-sheet/v/')
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/test-excel-1-sheet/v/'))
})

// end of [pushing excel file with 1 sheet]

// QA test [pushing excel file with selected sheets]
// also includes:
// [pushing excel file with selected non existing sheet]
// [pushing excel file with all sheets]
// [pushing excel file with list of sheets]

test.serial('push command succeeds for Excel with selected sheet', async t => {
  let path_ = 'test/fixtures/test-data/files/excel/sample-2-sheets.xls'
  const argName = '--name=test-excel-2-sheets'
  let argSheets = '--sheets=2'
  let result = await runcli('push', path_, argName, argSheets, '--debug')
  // Check what's printed in console while in debug mode, e.g., if schema is included:
  let hasSchemaForSecondSheet = result.stdout.includes('"name": "header4"')
  t.truthy(hasSchemaForSecondSheet)
  let hasPublishedMessage = result.stdout.includes('your data is published!')
  let hasURLtoShowcase = result.stdout.includes('https://datahub.io/test/test-excel-2-sheets/v/')
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  let whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/test-excel-2-sheets/v/'))

  path_ = 'test/fixtures/test-data/files/excel/sample-2-sheets.xlsx'
  result = await runcli('push', path_, argName, argSheets, '--debug')
  // Check what's printed in console while in debug mode, e.g., if schema is included:
  hasSchemaForSecondSheet = result.stdout.includes('"name": "header4"')
  t.truthy(hasSchemaForSecondSheet)
  hasPublishedMessage = result.stdout.includes('your data is published!')
  hasURLtoShowcase = result.stdout.includes('https://datahub.io/test/test-excel-2-sheets/v/')
  t.truthy(hasPublishedMessage)
  t.truthy(hasURLtoShowcase)
  whatsInClipboard = await clipboardy.read()
  t.true(whatsInClipboard.includes('https://datahub.io/test/test-excel-2-sheets/v/'))

  argSheets = '--sheets=5'
  result = await runcli('push', path_, argName, argSheets, '--debug')
  let hasErrorMsg = result.stdout.includes('Error! sheet index 5 is out of range')
  t.truthy(hasErrorMsg)

  argSheets = '--sheets=all'
  result = await runcli('push', path_, argName, argSheets, '--debug')
  let hasSchemaForFirstSheet = result.stdout.includes('"name": "header1"')
  hasSchemaForSecondSheet = result.stdout.includes('"name": "header4"')
  t.truthy(hasSchemaForFirstSheet)
  t.truthy(hasSchemaForSecondSheet)

  argSheets = '--sheets=1,2'
  result = await runcli('push', path_, argName, argSheets, '--debug')
  hasSchemaForFirstSheet = result.stdout.includes('"name": "header1"')
  hasSchemaForSecondSheet = result.stdout.includes('"name": "header4"')
  t.truthy(hasSchemaForFirstSheet)
  t.truthy(hasSchemaForSecondSheet)
})

// end of [pushing excel file with selected sheets]


test('push command fails for resources with invalid URL as path', async t => {
  const url_ = 'https://github.com/datasets/testtest'
  const argName = '--name=test'
  let result = await runcli('push', url_, argName)
  let stdout = result.stdout.split('\n')
  let hasErrorMsg = stdout.find(item => item.includes('> Error! Invalid URL. 404 Not Found: https://github.com/datasets/testtest'))
  t.truthy(hasErrorMsg)

  // Pushing a dataset with remote resource:
  const path_ = 'test/fixtures/test-data/packages/invalid-remote-path/'
  result = await runcli('push', path_, argName)
  stdout = result.stdout.split('\n')
  hasErrorMsg = stdout.find(item => item.includes('> Error! '))
  t.truthy(hasErrorMsg)
})
