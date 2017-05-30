const assert = require('assert')
const generateDescriptor = require('../lib/descriptor.js').generateDescriptor

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
      assert.deepEqual(JSON.stringify(val.resources[0]['schema']), JSON.stringify(expectedSchema))
    })
  })
})
