const test = require('ava')
const {
  normalizeSchema, normalizeType, nomralizeDateFormat, normalizeAll, normalizeNames
} = require('../lib/normalize.js')
const {runcli} = require('./cli.test.js')

const dp = {
  name: 'example',
  author: 'Mikane',
  licenses: {
    name: 'example license',
    url: 'https://example/license.com'
  },
  resources: [
    {
      url: 'https://raw.github.com/datasets/dp/ppp-gdp.csv',
      path: 'dp/ppp-gdp.csv',
      format: 'csv',
      mediatype: 'text/csv',
      schema: {
        fields: [
          {
            name: 'Country',
            type: 'string'
          },
          {
            name: 'Country ID',
            type: 'decimal',
            description: 'ISO 3166-1 alpha-2 code'
          },
          {
            name: 'Year',
            type: 'date',
            format: 'YYYY',
            description: 'Relevant year'
          }
        ]}
    }
  ],
  sources: [
    {
      name: 'source-name'
    }
  ],
  contributors: [
    {
      name: 'contributor-name'
    }
  ]
}

test('checks normalized all properties', t => {
  const res = normalizeAll(dp)
  const exp = {
    name: 'example',
    licenses: [{
      name: 'example_license',
      url: 'https://example/license.com'
    }],
    resources: [
      {
        name: 'ppp-gdp',
        path: 'dp/ppp-gdp.csv',
        format: 'csv',
        mediatype: 'text/csv',
        schema: {
          fields: [
            {
              name: 'Country',
              type: 'string'
            },
            {
              name: 'Country ID',
              type: 'number',
              description: 'ISO 3166-1 alpha-2 code'
            },
            {
              name: 'Year',
              type: 'date',
              format: 'any',
              description: 'Relevant year'
            }
          ]}
      }
    ],
    sources: [
      {
        title: 'source-name',
        name: 'source-name'
      }
    ],
    contributors: [
      {
        title: 'contributor-name'
      },
      {
        title: 'Mikane'
      }
    ]
  }
  t.deepEqual(res, exp)
})

test.skip('"data norm[alize] test/fixtures/datapackage.json" normalizes datapackage.json with given file path', async t => {
  const result = await runcli('normalize', 'test/fixtures/datapackage.json')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalized'))
})

test.skip('"data norm[alize] test/fixtures" normalizes datapackage.json inside given folder', async t => {
  const result = await runcli('normalize', 'test/fixtures')

  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[0].includes('Datapackage.json has been normalized'))
})
