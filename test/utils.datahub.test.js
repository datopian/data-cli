const path = require('path')
const test = require('ava')
const nock = require('nock')
const urljoin = require('url-join')
const {Dataset, File} = require('data.js')

const {DataHub, processExcelSheets, handleOutputs} = require('../lib/utils/datahub.js')

test('Can instantiate DataHub', t => {
  const apiUrl = 'https://apifix.datahub.io'
  const token = ''
  const datahub = new DataHub({apiUrl, token})
  t.is(datahub.apiUrl, apiUrl)
})

// =====================
// Push stuff

const config = {
  token: 't35tt0k3N',
  api: 'https://test.com',
  profile: {
    id: 'test-userid',
    username: 'test-username'
  }
}

const datahub = new DataHub({apiUrl: config.api, token: config.token, ownerid: config.profile.id, owner: config.profile.username})

const dpinfo = {
  md5: 'm84YSonibUrw5Mg8QbCNHA==',
  length: 72,
  name: 'datapackage.json'
}

const finVixInfo = {
  'data/vix-daily.csv': {
    length: 719,
    md5: 'zqYInZMy1fFndkTED3QUPQ==',
    name: 'vix-daily'
  },
  'datapackage.json': {
    length: 2830,
    md5: 's6Ex9JHrfrGSkEF7Gin8jg==',
    name: 'datapackage.json'
  }
}

const rawstoreUrl = 'https://s3-us-west-2.amazonaws.com'

const authorizeForServices = nock(config.api, {reqheaders: {'Auth-Token': 't35tt0k3N'}})
  .persist()
  .get('/auth/authorize?service=rawstore')
  .reply(200, {
    permissions: {},
    service: 'test',
    token: 'authz.token',
    userid: 'testid'
  })
  .get('/auth/authorize?service=source')
  .reply(200, {
    permissions: {},
    service: 'test',
    token: 'authz.token',
    userid: 'testid'
  })

const rawstoreAuthorize = nock(config.api, {reqheaders: {'Auth-Token': 'authz.token'}})
  .persist()
  .post('/rawstore/authorize', {
    metadata: {
      owner: config.profile.id,
      findability: 'unlisted'
    },
    filedata: {'datapackage.json': dpinfo}
  })
  .reply(200, {
    filedata: {
      'datapackage.json': {
        md5: dpinfo.md5,
        length: 85,
        name: 'datapackage.json',
        type: 'application/json',
        // eslint-disable-next-line camelcase
        upload_query: {
          key: dpinfo.md5,
          policy: '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        // eslint-disable-next-line camelcase
        upload_url: rawstoreUrl
      }
    }
  })

const rawstoreAuthorize2 = nock(config.api, {reqheaders: {'Auth-Token': 'authz.token'}})
  .persist()
  .post('/rawstore/authorize', {
    metadata: {
      owner: config.profile.id,
      findability: 'unlisted'
    },
    filedata: finVixInfo
  })
  .reply(200, {
    filedata: {
      'data/vix-daily.csv': {
        md5: finVixInfo['data/vix-daily.csv'].md5,
        length: finVixInfo['data/vix-daily.csv'].length,
        name: finVixInfo['data/vix-daily.csv'].name,
        // eslint-disable-next-line camelcase
        upload_query: {
          key: finVixInfo['data/vix-daily.csv'].md5,
          policy: '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        // eslint-disable-next-line camelcase
        upload_url: rawstoreUrl
      },
      'datapackage.json': {
        md5: finVixInfo['datapackage.json'].md5,
        length: finVixInfo['datapackage.json'].length,
        name: 'datapackage.json',
        // eslint-disable-next-line camelcase
        upload_query: {
          key: finVixInfo['datapackage.json'].md5,
          policy: '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        // eslint-disable-next-line camelcase
        upload_url: rawstoreUrl
      }
    }
  })

const rawstoreAuthorizeRemoteResource = nock(config.api, {reqheaders: {'Auth-Token': 'authz.token'}})
  .persist()
  .post('/rawstore/authorize', {
    "metadata": {
      "owner": "test-userid",
      "findability": "unlisted"
    },
    "filedata": {
      "datapackage.json": {
        "length": 257,
        "md5": "iwWrmUOdQ2tuOPx8P5wU7w==",
        "name": "datapackage.json"
      }
    }
  })
  .reply(200, {
    filedata: {
      'datapackage.json': {
        md5: "iwWrmUOdQ2tuOPx8P5wU7w==",
        length: 257,
        name: 'datapackage.json',
        // eslint-disable-next-line camelcase
        upload_query: {
          key: "iwWrmUOdQ2tuOPx8P5wU7w==",
          policy: '...',
          'x-amz-algorithm': 'AWS4-HMAC-SHA256',
          'x-amz-credential': 'XXX',
          'x-amz-signature': 'YYY'
        },
        // eslint-disable-next-line camelcase
        upload_url: rawstoreUrl
      }
    }
  })

const rawstoreStorageMock = nock(rawstoreUrl, {
}).persist().post(
    // TODO: get uploadBody working
    '/', // UploadBody
    ).reply(204)

const apiSpecStore = nock(config.api, {
  reqheaders: {
    'Auth-Token': 'authz.token'
  }
}).persist()
  .post('/source/upload', (body) => {
    const expected = {
      meta: {
        version: 1,
        ownerid: config.profile.id,
        owner: config.profile.username,
        dataset: 'dp-no-resources',
        findability: 'unlisted'
      },
      inputs: [
        {
          kind: 'datapackage',
          url: 'https://s3-us-west-2.amazonaws.com/m84YSonibUrw5Mg8QbCNHA==',
          parameters: {
            'resource-mapping': {}
          }
        }
      ]
    }
    delete body.inputs[0].parameters.descriptor
    return JSON.stringify(body) === JSON.stringify(expected)
  })
  .reply(200, {
    success: true,
    id: 'test',
    errors: []
  })

const apiSpecStoreRemoteResource = nock(config.api, {
  reqheaders: {
    'Auth-Token': 'authz.token'
  }
})
  .persist()
  .post('/source/upload', (body) => {
    const expected = {
      "meta": {
        "version": 1,
        "ownerid": "test-userid",
        "owner": "test-username",
        "dataset": "dp-no-resources",
        "findability": "unlisted"
      },
      "inputs": [
        {
          "kind": "datapackage",
          "url": "https://s3-us-west-2.amazonaws.com/iwWrmUOdQ2tuOPx8P5wU7w==",
          "parameters": {
            "resource-mapping": {}
          }
        }
      ]
    }
    delete body.inputs[0].parameters.descriptor
    return JSON.stringify(body) === JSON.stringify(expected)
  })
  .reply(200, {
    success: true,
    id: 'test',
    errors: []
  })

const apiSpecStore2 = nock(config.api, {
  reqheaders: {
    'Auth-Token': 'authz.token'
  }
})
  .persist()
  .post('/source/upload', (body) => {
    const expected = {
      meta: {
        version: 1,
        ownerid: config.profile.id,
        owner: config.profile.username,
        dataset: 'finance-vix',
        findability: 'unlisted'
      },
      inputs: [
        {
          kind: 'datapackage',
          url: urljoin(rawstoreUrl, finVixInfo['datapackage.json'].md5),
          parameters: {
            'resource-mapping': {
              'data/vix-daily.csv': urljoin(rawstoreUrl, finVixInfo['data/vix-daily.csv'].md5)
            }
          }
        }
      ],
      schedule: 'every 1d'
    }
    delete body.inputs[0].parameters.descriptor
    return JSON.stringify(body) === JSON.stringify(expected)
  })
  .reply(200, {
    success: true,
    id: 'test',
    errors: []
  })

const apiSpecStore3 = nock(config.api, {
  reqheaders: {
    'Auth-Token': 'authz.token'
  }
})
  .persist()
  .post('/source/upload', {
    meta: {
      version: 1,
      ownerid: 'testid',
      owner: 'test',
      dataset: 'finance-vix',
      findability: 'published'
    },
    inputs: [
      {
        kind: 'datapackage',
        url: 'http:/testing.com/.datahub/datapackage.json',
        parameters: {
          'resource-mapping': {
            'vix-daily': 'http:/testing.com/vixcurrent.csv'
          }
        }
      }
    ],
    processing: [
      {
        input: 'vix-daily',
        tabulator: {
          skip_rows: 2,
          headers: [
            'Date',
            'VIXOpen',
            'VIXHigh',
            'VIXLow',
            'VIXClose'
          ],
        },
        output: 'vix-daily'
      }
    ],
    schedule: 'every 1d'
  })
  .reply(200, {
    success: true,
    id: 'test',
    errors: []
  })

const signurl = nock(config.api, {reqheaders: {'Auth-Token': 'authz.token'}})
  .persist()
  .get('/rawstore/presign?ownerid=test-userid&url=https://s3-us-west-2.amazonaws.com/m84YSonibUrw5Mg8QbCNHA==')
  .reply(200, {url: 'https://s3-us-west-2.amazonaws.com/m84YSonibUrw5Mg8QbCNHA=='})
  .get('/rawstore/presign?ownerid=test-userid&url=https://s3-us-west-2.amazonaws.com/s6Ex9JHrfrGSkEF7Gin8jg==')
  .reply(200, {url: 'https://s3-us-west-2.amazonaws.com/s6Ex9JHrfrGSkEF7Gin8jg=='})
  .get('/rawstore/presign?ownerid=test-userid&url=https://s3-us-west-2.amazonaws.com/zqYInZMy1fFndkTED3QUPQ==')
  .reply(200, {url: 'https://s3-us-west-2.amazonaws.com/zqYInZMy1fFndkTED3QUPQ=='})
  .get('/rawstore/presign?ownerid=test-userid&url=https://s3-us-west-2.amazonaws.com/iwWrmUOdQ2tuOPx8P5wU7w==')
  .reply(200, {url: 'https://s3-us-west-2.amazonaws.com/m84YSonibUrw5Mg8QbCNHA=='})


test('push works with packaged dataset', async t => {
  const dataset = await Dataset.load('test/fixtures/dp-no-resources')
  const options = {findability: 'unlisted'}
  await datahub.push(dataset, options)

  t.is(rawstoreAuthorize.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore.isDone(), true)
  t.is(authorizeForServices.isDone(), true)

  // TODO: make sure we have not altered the dataset.resources object in any way
  t.is(dataset.resources.length, 0)
})

test('push-flow works', async t => {
  await datahub.pushFlow('test/fixtures/finance-vix/.datahub/flow.yaml')
  t.is(apiSpecStore3.isDone(), true)
})

test('push works with virtual package', async t => {
  const descriptor = {
    name: 'dp-no-resources',
    title: 'DP with No Resources',
    resources: []
  }
  const dataset = await Dataset.load(descriptor)
  const options = {findability: 'unlisted'}
  await datahub.push(dataset, options)

  t.is(rawstoreAuthorize.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore.isDone(), true)
  t.is(authorizeForServices.isDone(), true)

  // TODO: make sure we have not altered the dataset.resources object in any way
  t.is(dataset.resources.length, 0)
})

test('push works with package with resource and schedule can be setup', async t => {
  const dataset = await Dataset.load('test/fixtures/finance-vix')
  const options = {
    findability: 'unlisted',
    schedule: 'every 1d'
  }
  await datahub.push(dataset, options)

  t.is(rawstoreAuthorize2.isDone(), true)
  t.is(rawstoreStorageMock.isDone(), true)
  t.is(apiSpecStore2.isDone(), true)
  t.is(authorizeForServices.isDone(), true)
})

test('push works with package with remote resource', async t => {
  const dataset = await Dataset.load('test/fixtures/dp-remote-resource')
  await datahub.push(dataset, {findability: 'unlisted'})
  t.is(rawstoreAuthorizeRemoteResource.isDone(), true)
  t.is(apiSpecStore.isDone(), true)
})

// processExcelSheets function
test('processExcelSheets function works', async t => {
  const filePath = 'test/fixtures/sample-2sheets.xlsx'
  const pathParts = path.parse(filePath)
  const file = File.load(pathParts.base, {basePath: pathParts.dir})
  const metadata = {
    name: 'test',
    resources: []
  }
  const dataset = await Dataset.load(metadata)
  dataset.addResource(file)
  let processing = await processExcelSheets(dataset.resources)
  t.is(processing[0].input, 'sample-2sheets')
  t.is(processing[0].output, 'sample-2sheets-sheet-1')
  t.is(processing[0].schema.fields[0].name, 'header1')
  processing = await processExcelSheets(dataset.resources, 'all')
  t.is(processing[1].output, 'sample-2sheets-sheet-2')
  processing = await processExcelSheets(dataset.resources, '2')
  t.is(processing.length, 1)
  t.is(processing[0].output, 'sample-2sheets-sheet-2')
})

// handleOutputs function
test('handleOutputs function works', t => {
  const outputsConfig = {
    zip: true,
    sqlite: true
  }
  const outputs = handleOutputs(outputsConfig)
  const exp = [
    {
      kind: 'zip',
      parameters: {
        'out-file': 'dataset.zip'
      }
    },
    {
      kind: 'sqlite'
    }
  ]
  t.deepEqual(outputs, exp)
})

test('makeSourceSpec function works', async t => {
  const rawstoreResponse = {
    'datapackage.json': {
      md5: finVixInfo['datapackage.json'].md5,
      length: finVixInfo['datapackage.json'].length,
      name: 'datapackage.json',
      // eslint-disable-next-line camelcase
      upload_query: {
        key: finVixInfo['datapackage.json'].md5,
        policy: '...',
        'x-amz-algorithm': 'AWS4-HMAC-SHA256',
        'x-amz-credential': 'XXX',
        'x-amz-signature': 'YYY'
      },
      // eslint-disable-next-line camelcase
      upload_url: rawstoreUrl,
      rawstore_url: rawstoreUrl + '/' + finVixInfo['datapackage.json'].md5
    }
  }
  const dataset = await Dataset.load('test/fixtures/finance-vix')
  const options = {findability: 'unlisted'}
  const spec = await datahub.makeSourceSpec(rawstoreResponse, dataset, options)
  t.is(spec.meta.dataset, 'finance-vix')
  t.is(spec.inputs[0].kind, 'datapackage')
  t.deepEqual(spec.inputs[0].parameters.descriptor, dataset.descriptor)
})
