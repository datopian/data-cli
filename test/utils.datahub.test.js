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
    "{\n  \"name\": \"dp-no-resources\",\n  \"title\": \"DP with No Resources\",\n  \"resources\": []\n}"
  ).reply(200)

const apiSpecStore = nock(config.api, {
  reqheaders: {
    "Auth-Token": "t35tt0k3N"
  }
  }).post('/source/upload', {
    "meta": {
      "version": 1,
      "owner": undefined
    },
    inputs: [
      {
        kind: 'datapackage',
        url: 'https://s3-us-west-2.amazonaws.com/',
        parameters: {
          "resource-mapping": {}
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
  t.is(apiSpecStore.isDone(), true)

  // TODO: make sure we have not altered the pkg.resources object in any way
  t.is(pkg.resources.length, 0)
})

