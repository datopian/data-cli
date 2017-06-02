const test = require('ava')
const push = require('../lib/push')
const nock = require('nock')

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com'
}

const dpinfo = {
  md5: "a2a917cc462afa205b7ae46c590ebf55",
  name: "test/fixtures/datapackage.json",
  size: 305,
  type: "application/json",
}

const postToken = nock(config.server)
      .persist()
      .post('/api/auth/token', {
        username: config.username,
        secret: config.secretToken
      })
      .reply(200, { token: 't35tt0k3N' })

const postAuthorize = nock(config.server, {reqheaders : {"auth-token": "t35tt0k3N"}})
      .persist()
      .post('/api/datastore/authorize', {
        metadata: {
            owner: config.username,
            name: 'test'
        },
        filedata: {'datapackage.json': dpinfo}
      })
      .reply(200, { filedata: {'datapackage.json':{
        upload_url: 'https://s3-us-west-2.amazonaws.com/bits-staging.datapackaged.com'
      }}})

test('Gets the token', async t => {
  const token = await push.getToken(config)
  const expToken = 't35tt0k3N'
  t.is(token, expToken)
})

test('Checks if datapackage.json exists in cwd', t => {
  let out = push.checkDpIsThere()
  t.false(out)
})

test('Gets correct file info for regular file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/sample.csv')
  const exp = {
    md5: "b0661d9566498a800fbf95365ce28747",
    name: "test/fixtures/sample.csv",
    size: 46,
    type: "binary/octet-stream",
  }
  t.deepEqual(fileInfo, exp)
})

test('Gets correct file info for json file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/datapackage.json')
  t.deepEqual(fileInfo, dpinfo)
})

test('Gets File data (authenticate)', async t => {
  const fileInfo = {
    metadata: {
        owner: config.username,
        name: 'test'
    },
    filedata: {'datapackage.json': dpinfo}
  }
  const exp = {
    "datapackage.json": {
      upload_url: "https://s3-us-west-2.amazonaws.com/bits-staging.datapackaged.com",
    },
  }
  const fileData = await push.getFileData(config, fileInfo, 't35tt0k3N')
  t.deepEqual(fileData, exp)
})
