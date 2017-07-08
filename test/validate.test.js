const test = require('ava')
const nock = require('nock')
const urljoin = require('url-join')
const { validate } = require('../lib/validate')
const { data } = require('./data.js')

test.before(t => {
  const mockGitHub = nock('https://raw.githubusercontent.com')
        .persist()
        .get('/datasets/co2-ppm/master/datapackage.json')
        .replyWithFile(200, './test/fixtures/co2-ppm/datapackage.json')
})

test.after(t => {
  nock.restore()
})

// optimal would be test with local file but way identifier parsing works makes that painful
// next best is github with mocking
test('validate works with github id', async t => {
  const pkgid = 'https://github.com/datasets/co2-ppm'
  const res = await validate(pkgid)
  t.true(res)
})

test('"data help validate" prints help message', async t => {
  const result = await data('help', 'validate')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Validate a descriptor'))
})
