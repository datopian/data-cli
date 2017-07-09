const test = require('ava')
const nock = require('nock')

const { DataHub } = require('../lib/utils/datahub.js')
const { Package } = require('../lib/utils/data.js')


test('Can instantiate DataHub', t => {
  const apiUrl = 'https://apifix.datahub.io'
  const token = ''
  const datahub = new DataHub({apiUrl, token})
  t.is(datahub.apiUrl, apiUrl)
})


// =====================
// Push stuff

let config = {
  username: 'test',
  token: 't35tt0k3N',
  api: 'https://test.com'
}

const datahub = new DataHub({apiUrl: config.api, token: config.token})

const dpjson = require('./fixtures/datapackage.json')


const dpinfo = {
  md5: 'e4G1LoZWt07QvELiaGE8uA==',
  name: 'datapackage',
  length: 85
}

const rawstoreUrl = 'https://s3-us-west-2.amazonaws.com/'

const apiAuthorize = nock(config.api, {reqheaders : {"Auth-Token": "t35tt0k3N"}})
      .persist()
      .post('/rawstore/authorize', {
        metadata: {
          // TODO: reinstate
            owner: null,
            name: null
        },
        filedata: {'datapackage.json': dpinfo}
      })
      .reply(200, {
        filedata: {
          'datapackage.json': {
            'md5': "s0mEhash#",
            'name': 'datapackage.json',
            'type': 'application/json',
            'upload_query': {
              'key': '...',
              'policy': '...',
              'x-amz-algorithm': 'AWS4-HMAC-SHA256',
              'x-amz-credential': 'XXX',
              'x-amz-signature': 'YYY'
            },
            'upload_url': rawstoreUrl
          }
        }
      })

const qs = '?key=...&policy=...&x-amz-algorithm=AWS4-HMAC-SHA256&x-amz-credential=XXX&x-amz-signature=YYY'
const rawstoreMock = nock(rawstoreUrl, {
  }).post('/' + qs,
    // TODO: get this working
    // {
    // body: '{\n  "name": "dp-no-resources",\n  "title": "DP with No Resources",\n  "resources": []\n}'
  // }
  ).reply(200)

const apiSpecStore = nock(config.api, {
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



test('push works with packaged dataset', async t => {
  var pkg = new Package('test/fixtures/dp-no-resources')
  await pkg.load()
  var out = await datahub.push(pkg)

  t.is(apiAuthorize.isDone(), true)
  t.is(rawstoreMock.isDone(), true)

  // TODO: make sure we have not altered the pkg.resources object in any way
  t.is(pkg.resources.length, 0)
})




/*
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
*/

/*
test('Gets File data (authorize)', async t => {
  const fileInfo = {
    metadata: {
        // TODO: owner?
        owner: '',
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
  const fileData = await datahub.rawstoreAuthorize(fileInfo)
  t.deepEqual(fileData, exp)
})
*/

/*
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
*/

/*
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
*/
