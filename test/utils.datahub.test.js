const test = require('ava')
const nock = require('nock')
const urljoin = require('url-join')

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
  token: 't35tt0k3N',
  api: 'https://test.com',
  profile: {
    id: 'test-userid'
  }
}

const datahub = new DataHub({apiUrl: config.api, token: config.token, owner: config.profile.id})

const dpjson = require('./fixtures/datapackage.json')

const dpinfo = {
  md5: 'm84YSonibUrw5Mg8QbCNHA==',
  length: 72
}

const finVixInfo = {
  'data/vix-daily.csv': {
    'length': 719,
    'md5': 'zqYInZMy1fFndkTED3QUPQ==',
    'name': 'vix-daily'
  },
  'datapackage.json': {
    'length': 739,
    'md5': 'Sw1GeJlVHjuC+CGPAFx1rA=='
  }
}

const rawstoreUrl = 'https://s3-us-west-2.amazonaws.com'

const authorizeForServices = nock(config.api, {reqheaders : {"Auth-Token": "t35tt0k3N"}})
  .persist()
  .get('/auth/authorize?service=rawstore')
  .reply(200, {
    "permissions": {},
    "service": "test",
    "token": "authz.token",
    "userid": "testid"
  })
  .get('/auth/authorize?service=source')
  .reply(200, {
    "permissions": {},
    "service": "test",
    "token": "authz.token",
    "userid": "testid"
  })

const rawstoreAuthorize = nock(config.api, {reqheaders : {"Auth-Token": "authz.token"}})
  .persist()
  .post('/rawstore/authorize', {
    metadata: {
      // TODO: reinstate
        owner: config.profile.id,
        name: 'does-not-matter-what-this-is'
    },
    filedata: {'datapackage.json': dpinfo}
  })
  .reply(200, {
    filedata: {
      'datapackage.json': {
        'md5': dpinfo.md5,
        'length': 85,
        'name': 'datapackage.json',
        'type': 'application/json',
        'upload_query': {
          'key': dpinfo.md5,
          'policy': '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        'upload_url': rawstoreUrl
      }
    }
  })

const rawstoreAuthorize2 = nock(config.api, {reqheaders : {"Auth-Token": "authz.token"}})
  .persist()
  .post('/rawstore/authorize', {
    metadata: {
      owner: config.profile.id,
      name: 'does-not-matter-what-this-is'
    },
    filedata: finVixInfo
  })
  .reply(200, {
    filedata: {
      'data/vix-daily.csv': {
        'md5': finVixInfo['data/vix-daily.csv'].md5,
        'length': finVixInfo['data/vix-daily.csv'].length,
        'name': finVixInfo['data/vix-daily.csv'].name,
        'upload_query': {
          'key': finVixInfo['data/vix-daily.csv'].md5,
          'policy': '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        'upload_url': rawstoreUrl
      },
      'datapackage.json': {
        'md5': finVixInfo['datapackage.json'].md5,
        'length': finVixInfo['datapackage.json'].length,
        'name': finVixInfo['datapackage.json'].name,
        'upload_query': {
          'key': finVixInfo['datapackage.json'].md5,
          'policy': '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        'upload_url': rawstoreUrl
      }
    }
  })

let uploadBody = "----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"key\"\r\n\r\n...\r\n----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"policy\"\r\n\r\n...\r\n----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"x-amz-algorithm\"\r\n\r\nAWS4-HMAC-SHA256\r\n----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"x-amz-credential\"\r\n\r\nXXX\r\n----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"x-amz-signature\"\r\n\r\nYYY\r\n----------------------------343201334899050500716132\r\nContent-Disposition: form-data; name=\"file\"; filename=\"datapackage.json\"\r\nContent-Type: application/json\r\n\r\n{\n  \"name\": \"dp-no-resources\",\n  \"title\": \"DP with No Resources\",\n  \"resources\": []\n}\r\n----------------------------343201334899050500716132--\r\n"
const rawstoreStorageMock = nock(rawstoreUrl, {
  }).persist().post(
    // TODO: get uploadBody working
    '/', // uploadBody
    ).reply(204)

const apiSpecStore = nock(config.api, {
  reqheaders: {
    "Auth-Token": "authz.token"
  }
  }).persist().post('/source/upload', {
    "meta": {
      "version": 1,
      "owner": config.profile.id
    },
    inputs: [
      {
        kind: 'datapackage',
        url: urljoin(rawstoreUrl, dpinfo.md5),
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

const apiSpecStore2 = nock(config.api, {
  reqheaders: {
    "Auth-Token": "authz.token"
  }
})
  .persist()
  .post('/source/upload', {
    'meta': {
      'version': 1,
      'owner': config.profile.id
    },
    'inputs': [
      {
        'kind': 'datapackage',
        'url': urljoin(rawstoreUrl, finVixInfo['datapackage.json'].md5),
        'parameters': {
          'resource-mapping': {
            'data/vix-daily.csv': urljoin(rawstoreUrl, finVixInfo['data/vix-daily.csv'].md5)
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
  var pkg = await Package.load('test/fixtures/dp-no-resources')
  var out = await datahub.push(pkg)

  t.is(rawstoreAuthorize.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore.isDone(), true)
  t.is(authorizeForServices.isDone(), true)

  // TODO: make sure we have not altered the pkg.resources object in any way
  t.is(pkg.resources.length, 0)
})

test('push works with virtual package', async t => {
  const descriptor = {
    "name": "dp-no-resources",
    "title": "DP with No Resources",
    "resources": []
  }
  var pkg = await Package.load(descriptor)
  var out = await datahub.push(pkg)

  t.is(rawstoreAuthorize.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore.isDone(), true)
  t.is(authorizeForServices.isDone(), true)

  // TODO: make sure we have not altered the pkg.resources object in any way
  t.is(pkg.resources.length, 0)
})

test('push works with package with resource', async t => {
  const pkg = await Package.load('test/fixtures/finance-vix')
  await datahub.push(pkg)

  t.is(rawstoreAuthorize2.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore2.isDone(), true)
  t.is(authorizeForServices.isDone(), true)
})
