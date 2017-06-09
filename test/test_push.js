const test = require('ava')
const push = require('../lib/push')
const nock = require('nock')

const dpjson = require('./fixtures/datapackage.json')

let config = {
  username: 'test',
  secretToken: 'secret',
  server: 'https://test.com'
}

const dpinfo = {
  md5: "hfsvgF7g9q6VsBAv63zB0w==",
  name: "test/fixtures/datapackage.json",
  size: 712,
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
    md5: "sGYdlWZJioAPv5U2XOKHRw==",
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

test('Gets correct file list', t => {
  const exp = ['datapackage.json', 'README.md', 'dp/ppp-gdp.csv']
  const res = push.getFileList(dpjson)
  t.deepEqual(exp, res)
})

test('Gets correct file info for request', t => {
  const files = ['test/fixtures/datapackage.json', 'README.md', 'test/fixtures/sample.csv']
  const res = push.getFilesForRequest(files, 'publisher', 'package')
  const exp = {
    filedata: {
      "README.md": {
        md5: "WCPiBZTZssO/uTd4IT/X0w==",
        name: "README.md",
        size: 1018,
        type: "binary/octet-stream",
      },
      "test/fixtures/datapackage.json": {
        md5: "hfsvgF7g9q6VsBAv63zB0w==",
        name: "test/fixtures/datapackage.json",
        size: 712,
        type: "application/json",
      },
      "test/fixtures/sample.csv": {
        md5: "sGYdlWZJioAPv5U2XOKHRw==",
        name: "test/fixtures/sample.csv",
        size: 46,
        type: "binary/octet-stream",
      },
    },
    metadata: {
      name: "package",
      owner: "publisher",
    },
  }
  t.deepEqual(exp, res)
})
