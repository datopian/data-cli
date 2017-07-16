const parse = require('csv-parse')
const infer = require('tableschema').infer

const generateDescriptor = async (data, dpName = 'scratchpad') => {
  const descriptor = {
    name: dpName,
    resources: [
      {
        format: 'csv',
        data
      }
    ]
  }

  await parse(data, (error, values) => {
    if (error) {
      process.stdout.write(error.message)
    } else {
      const headers = values.shift()
      const schema = infer(headers, values)
      descriptor.resources[0].schema = schema
    }
  })
  return descriptor
}
module.exports.generateDescriptor = generateDescriptor
