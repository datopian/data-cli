const test = require('ava')
const {Agent} = require('datahub-client')

// ==========================
// USER RIGHTS & RESTRICTIONS

const mainPath = '/anuveyatsu/finance-vix'
const dpJsonPath = mainPath + '/datapackage.json'
const resourceCsvPath = mainPath + '/r/vix-daily.csv'
const resourceJsonPath = mainPath + '/r/vix-daily.json'
const zipPath = mainPath + '/r/finance-vix_zip.zip'

const agent = new Agent('https://datahub.io')

test('Access private dataset as unauthorized user', async t => {
  let response = await agent.fetch(mainPath)
  t.is(response.status, 404)
  response = await agent.fetch(dpJsonPath)
  t.is(response.status, 404)
  response = await agent.fetch(resourceCsvPath)
  t.is(response.status, 404)
  response = await agent.fetch(resourceJsonPath)
  t.is(response.status, 404)
  response = await agent.fetch(zipPath)
  t.is(response.status, 404)
})

test('Access private dataset as non-owner user', async t => {
  // Token for 'test' user (Travis knows it):
  const token = process.env.token
  let response = await agent.fetch(mainPath + `?jwt=${token}`)
  t.is(response.status, 404)
  response = await agent.fetch(dpJsonPath + `?jwt=${token}`)
  t.is(response.status, 404)
  response = await agent.fetch(resourceCsvPath + `?jwt=${token}`)
  t.is(response.status, 404)
  response = await agent.fetch(resourceJsonPath + `?jwt=${token}`)
  t.is(response.status, 404)
  response = await agent.fetch(zipPath + `?jwt=${token}`)
  t.is(response.status, 404)
})

test('Access private dataset as owner', async t => {
  // Owner's token is stored as secret env var on Travis
  const token = process.env.SECRET_OWNER_TOKEN
  let response = await agent.fetch(mainPath + `?jwt=${token}`)
  t.is(response.status, 200)
  response = await agent.fetch(dpJsonPath + `?jwt=${token}`)
  t.is(response.status, 200)
  response = await agent.fetch(resourceCsvPath + `?jwt=${token}`)
  t.is(response.status, 200)
  response = await agent.fetch(resourceJsonPath + `?jwt=${token}`)
  t.is(response.status, 200)
  response = await agent.fetch(zipPath + `?jwt=${token}`)
  t.is(response.status, 200)
})
