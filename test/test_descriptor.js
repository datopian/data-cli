const assert = require('assert')
const generateDescriptor = require('../lib/descriptor.js').generateDescriptor
const generateDescriptorForLocalFiles = require('../lib/descriptor.js').generateDescriptorForLocalFiles
let mock = require('mock-fs');


describe('generate dp', () => {
  it('from inline data', function() {
    const csvData = "a,b,c\n1,1991-01-13,test1\n4,1990-01-06,test2"
    const expectedSchema = { 
      fields: [ 
        { 
          name: 'a',
          title: '',
          description: '',
          type: 'integer',
          format: 'default'
        },
        { 
          name: 'b',
          title: '',
          description: '',
          type: 'date',
          format: 'default'
        },
        { 
          name: 'c',
          title: '',
          description: '',
          type: 'string',
          format: 'default'
        }
      ]
     }
    const out = generateDescriptor(csvData).then(val => {
      assert.deepEqual(val.resources[0]['schema'], expectedSchema)
    })
  })
})

describe('generate datapackage.json from local files: single file', () => {
  it('check for csv data schema', function() { 
    mock({
      'data and Data and data and Data.csv': 'a,b,c\n1,1991-01-01,test1'
    });
    const expectedSchema = 
    { 
      name: 'scratchpad',
      resources: [
        {
          path: 'data and Data and data and Data.csv',
          name: 'data-and-data-and-data-and-data',
          format: 'csv',
          schema: {
            fields: [
              {
                name: 'a',
                title: '',
                description: '',
                type: 'integer',
                format: 'default'
              },
              {
                name: 'b',
                title: '',
                description: '',
                type: 'date',
                format: 'default'
              },
              {
                name: 'c',
                title: '',
                description: '',
                type: 'string',
                format: 'default'
              }
            ]
          }
        }
      ]
    }
    
    const out = generateDescriptorForLocalFiles().then(val => {
      assert.deepEqual(val, expectedSchema)
      mock.restore();
    })  
  })
})

describe('generate datapackage.json from local files: multiple files', () => {
  it('check for multiple files', function() { 
    mock({
      'dataJSON.json': '{"name":"datapackaed.com","messages":["test 1","test 2","test 3"],"status":100}',
      'dataGEOJSON.geojson': '{ "type": "Point", "coordinates": [0, 0] }',
      'data-TOPOJSON.topojson': '{"type": "LineString", "arcs": [42]}',
      'testCSV CSV.csv': 'a,b,c\n1,1991-01-01,test1'
    });
    const expectedSchema = 
    { 
      name: 'scratchpad',
      resources: [
        {
          path: 'data-TOPOJSON.topojson',
          name: 'data-topojson',
          format: 'topojson'
        },
        {
          path: 'dataGEOJSON.geojson',
          name: 'datageojson',
          format: 'geojson'
        },
        {
          path: 'dataJSON.json',
          name: 'datajson',
          format: 'json'
        },
        {
          path: 'testCSV CSV.csv',
          name: 'testcsv-csv',
          format: 'csv',
          schema: {
            fields: [
              {
                name: 'a',
                title: '',
                description: '',
                type: 'integer',
                format: 'default'
              },
              {
                name: 'b',
                title: '',
                description: '',
                type: 'date',
                format: 'default'
              },
              {
                name: 'c',
                title: '',
                description: '',
                type: 'string',
                format: 'default'
              }
            ]
          }
        }]
    }
    
    const out = generateDescriptorForLocalFiles().then(val => {
      assert.deepEqual(val, expectedSchema)
      mock.restore();
    })  
  })
})