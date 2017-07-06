const test = require('ava')
const push = require('../lib/push')
const nock = require('nock')
const { data } = require('./data.js')

const dpjson = require('./fixtures/datapackage.json')

let config = {
  username: 'test',
  server: 'https://test.com',
  token: 't35tt0k3N',
  api: 'https://test.com'
}

const dpinfo = {
  md5: "hfsvgF7g9q6VsBAv63zB0w==",
  name: "test/fixtures/datapackage.json",
  length: 712,
  type: "application/json",
}

const apiAuthorize = nock(config.server, {reqheaders : {"Auth-Token": "t35tt0k3N"}})
      .persist()
      .post('/rawstore/authorize', {
        metadata: {
            owner: config.username,
            name: 'test'
        },
        filedata: {'datapackage.json': dpinfo}
      })
      .reply(200, {
        filedata: {
          'datapackage.json': {
            'md5-hash': "s0mEhash#",
            'name': 'datapackage.json',
            'type': 'application/json',
            'upload_query': {},
            'upload_url': 'https://s3-us-west-2.amazonaws.com/bits-staging.datapackaged.com'
          }
        }
      })

const apiSpecStore = nock(config.server, {
  reqheaders: {
    "Auth-Token": "t35tt0k3N"
  }
}).persist()
  .post('/source/upload', {
    "meta": {
      "version": 1,
      "owner": "test",
      "id": "<id>"
    },
    "inputs": [
      {
        "kind": "datapackage",
        "url": "http://test.com/hash1",
        "parameters": {
          "resource-mapping": {
            "file1": "http://test.com/hash2",
            "file2": "http://test.com/hash3"
          }
        }
      }
    ]
  })
  .reply(200, {
    "success": true,
    "id": "test",
    "errors": []
  })

const postFinalize = nock(config.server, {reqheaders : {"auth-token": "t35tt0k3N"}})
       .persist()
       .post('/api/package/upload', (body) => {
         return body.datapackage === "https://test.com"
       })
       .reply(200, {'status': 'queued'})

test('uploads file to BitStore', async t => {
  const dataPackageS3Url = "https://test.com"
  let res = await push.finalize(config, dataPackageS3Url, 't35tt0k3N')
  t.is(res.status, 'queued')
})

test('uploads spec into spec store', async t => {
  const resources = [
    {
      'name': 'file1'
    },
    {
      'name': 'file2'
    }
  ]
  const datafile = {
    'datapackage.json': {
      'md5': 'hash1',
      'upload_url': 'http://test.com'
    },
    'file1': {
      'md5': 'hash2'
    },
    'file2': {
      'md5': 'hash3'
    }
  }
  const out = await push.uploadToSpecStore(config, datafile, resources)
  t.is(out.success, true)
})

test('Gets correct file info for regular file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/sample.csv')
  const exp = {
    md5: "sGYdlWZJioAPv5U2XOKHRw==",
    name: "test/fixtures/sample.csv",
    length: 46,
    type: "binary/octet-stream",
  }
  t.deepEqual(fileInfo, exp)
})

test('Gets correct file info for json file', t => {
  const fileInfo = push.getFileInfo('test/fixtures/datapackage.json')
  t.deepEqual(fileInfo, dpinfo)
})

test('Gets File data (authorize)', async t => {
  const fileInfo = {
    metadata: {
        owner: config.username,
        name: 'test'
    },
    filedata: {'datapackage.json': dpinfo}
  }
  const exp = {
    'datapackage.json': {
      'md5-hash': "s0mEhash#",
      'name': 'datapackage.json',
      'type': 'application/json',
      'upload_query': {},
      'upload_url': 'https://s3-us-west-2.amazonaws.com/bits-staging.datapackaged.com'
    }
  }
  const fileData = await push.getFileData(config, fileInfo)
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
        length: 1018,
        type: "binary/octet-stream",
      },
      "test/fixtures/datapackage.json": {
        md5: "hfsvgF7g9q6VsBAv63zB0w==",
        name: "test/fixtures/datapackage.json",
        length: 712,
        type: "application/json",
      },
      "test/fixtures/sample.csv": {
        md5: "sGYdlWZJioAPv5U2XOKHRw==",
        name: "test/fixtures/sample.csv",
        length: 46,
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

test('"data help push" prints help message for push command', async t => {
  const result = await data('help', 'push')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))
})

test('"data push -h --help" prints help message for push command', async t => {
  let result = await data('push', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))

  result = await data('push', '--help')

  t.is(result.code, 0)
  stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))
})
