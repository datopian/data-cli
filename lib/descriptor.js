var parse = require('csv-parse')
var infer = require('tableschema').infer

const generateDescriptor = async function (data, dpName = "scratchpad") {
  var descriptor = {
    name: dpName,
    resources: [
      {
        format: "csv",
        data: data
      }
    ]
  }
  
  await parse(data, (error, values) => {
    if (error) {
      process.stdout.write(error.message)
    } else {
      var headers = values.shift()
          , schema = infer(headers, values)
      descriptor.resources[0]['schema'] = schema
    }
  })
  return descriptor
}
module.exports.generateDescriptor = generateDescriptor
