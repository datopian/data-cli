const http = require('http')

const test = require('ava')

// ==========================
// USER RIGHTS & RESTRICTIONS

const whatStatusCode = (path) => {
  const options = {method: 'HEAD', host: 'datahub.io', port: 80, path: path}
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
        resolve(res.statusCode)
      }
    )
    req.end()
  })
}

const path = '/anuveyatsu/finance-vix'
const dpJsonPath = path + '/datapackage.json'
const resourceCsvPath = path + '/r/vix-daily.csv'
const resourceJsonPath = path + '/r/vix-daily.json'
const zipPath = path + '/r/finance-vix_zip.zip'

test('Access private dataset as unauthorized user', async t => {
  t.is(await whatStatusCode(path), 404)
  t.is(await whatStatusCode(dpJsonPath), 404)
  t.is(await whatStatusCode(resourceCsvPath), 404)
  t.is(await whatStatusCode(resourceJsonPath), 404)
  t.is(await whatStatusCode(zipPath), 404)
})

test('Access private dataset as non-owner user', async t => {
  // Token for 'test' user (Travis knows it):
  const token = process.env.token
  t.is(await whatStatusCode(path + `?jwt=${token}`), 404)
  t.is(await whatStatusCode(dpJsonPath + `?jwt=${token}`), 404)
  t.is(await whatStatusCode(resourceCsvPath + `?jwt=${token}`), 404)
  t.is(await whatStatusCode(resourceJsonPath + `?jwt=${token}`), 404)
  t.is(await whatStatusCode(zipPath + `?jwt=${token}`), 404)
})

// P.S. the dataset was tested with owner account and returned non-404 status code
