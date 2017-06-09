const test = require('ava')
const {
  normalizeSchema, normalizeType, nomralizeDateFormat, normalizeAll, normalizeNames
} = require('../lib/normalize.js')

let dp = {
  "name": "example",
  "licenses": {
    "name": "example license",
    "url": "https://example/license.com"
  },
  "resources": [
  {
    "name": "PPP-Gdp",
    "path": "dp/ppp-gdp.csv",
    "format": "csv",
    "mediatype": "text/csv",
    "schema": {
    "fields": [
      {
        "name": "Country",
        "type": "string"
      },
      {
        "name": "Country ID",
        "type": "decimal",
        "description": "ISO 3166-1 alpha-2 code"
      },
      {
        "name": "Year",
        "type": "date",
        "format": "YYYY",
        "description": "Relevant year"
      }
    ]}
  }]
}

test('checks normalized schema', t => {

  let res = normalizeSchema(dp)
  const exp = {
    "name": "example",
    "licenses": [{
    "name": "example license",
    "url": "https://example/license.com"
    }],
    "resources": [
    {
      "name": "PPP-Gdp",
      "path": "dp/ppp-gdp.csv",
      "format": "csv",
      "mediatype": "text/csv",
      "schema": {
      "fields": [
        {
          "name": "Country",
          "type": "string"
        },
        {
          "name": "Country ID",
          "type": "decimal",
          "description": "ISO 3166-1 alpha-2 code"
        },
        {
          "name": "Year",
          "type": "date",
          "format": "YYYY",
          "description": "Relevant year"
        }
      ]}
    }]
    }
  t.deepEqual(res, exp)
})

test('checks normalized types', t => {
  let res = normalizeType(dp)
  const exp = {
    "name": "example",
    "licenses": [{
    "name": "example license",
    "url": "https://example/license.com"
  }],
    "resources": [
    {
      "name": "PPP-Gdp",
      "path": "dp/ppp-gdp.csv",
      "format": "csv",
      "mediatype": "text/csv",
      "schema": {
      "fields": [
        {
          "name": "Country",
          "type": "string"
        },
        {
          "name": "Country ID",
          "type": "number",
          "description": "ISO 3166-1 alpha-2 code"
        },
        {
          "name": "Year",
          "type": "date",
          "format": "YYYY",
          "description": "Relevant year"
        }
      ]}
    }]
    }
  t.deepEqual(res, exp)
})

test('checks normalized date format', t => {
  let res = nomralizeDateFormat(dp)
  const exp = {
    "name": "example",
    "licenses": [{
    "name": "example license",
    "url": "https://example/license.com"
  }],
    "resources": [
    {
      "name": "PPP-Gdp",
      "path": "dp/ppp-gdp.csv",
      "format": "csv",
      "mediatype": "text/csv",
      "schema": {
      "fields": [
        {
          "name": "Country",
          "type": "string"
        },
        {
          "name": "Country ID",
          "type": "number",
          "description": "ISO 3166-1 alpha-2 code"
        },
        {
          "name": "Year",
          "type": "date",
          "format": "any",
          "description": "Relevant year"
        }
      ]}
    }]
    }
  t.deepEqual(res, exp)
})

test('checks normalized resourse name', t => {
  let res = normalizeNames(dp)
  const exp = {
    "name": "example",
    "licenses": [{
    "name": "example license",
    "url": "https://example/license.com"
  }],
    "resources": [
    {
      "name": "ppp-gdp",
      "path": "dp/ppp-gdp.csv",
      "format": "csv",
      "mediatype": "text/csv",
      "schema": {
      "fields": [
        {
          "name": "Country",
          "type": "string"
        },
        {
          "name": "Country ID",
          "type": "number",
          "description": "ISO 3166-1 alpha-2 code"
        },
        {
          "name": "Year",
          "type": "date",
          "format": "any",
          "description": "Relevant year"
        }
      ]}
    }]
    }
  t.deepEqual(res, exp)
})

test('checks normalized resourse name', t => {
  let res = normalizeAll(dp)
  const exp = {
    "name": "example",
    "licenses": [{
    "name": "example license",
    "url": "https://example/license.com"
  }],
    "resources": [
    {
      "name": "ppp-gdp",
      "path": "dp/ppp-gdp.csv",
      "format": "csv",
      "mediatype": "text/csv",
      "schema": {
      "fields": [
        {
          "name": "Country",
          "type": "string"
        },
        {
          "name": "Country ID",
          "type": "number",
          "description": "ISO 3166-1 alpha-2 code"
        },
        {
          "name": "Year",
          "type": "date",
          "format": "any",
          "description": "Relevant year"
        }
      ]}
    }]
    }
  t.deepEqual(res, exp)
})
