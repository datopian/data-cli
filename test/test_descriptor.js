const assert = require('assert')
const generateDescriptor = require('../lib/descriptor.js').generateDescriptor

describe('generate dp', () => {
  it('from inline data', function() {
    const csvData = "a,b,c\n1,2,3\n4,5,6"
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
          type: 'integer',
          format: 'default'
        },
        { 
          name: 'c',
          title: '',
          description: '',
          type: 'integer',
          format: 'default'
        }
      ]
     }
    const out = generateDescriptor(csvData).then(val => {
      assert.equal(val.name, 'scratchpad')
      assert.equal(JSON.stringify(val.resources[0]['schema']), JSON.stringify(expectedSchema))
    })
  })
})
