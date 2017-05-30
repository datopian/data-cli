const parse = require('csv-parse')
const infer = require('tableschema').infer
var fs = require('fs')
var path = require('path')

const generateDescriptor = async (data, dpName = "scratchpad") => {
  let descriptor = {
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
      let headers = values.shift()
          , schema = infer(headers, values)
      descriptor.resources[0]['schema'] = schema
    }
  })
  return descriptor
}
module.exports.generateDescriptor = generateDescriptor

const generateDescriptorForLocalFiles = function (dpName = "scratchpad") { 
  return new Promise(function(resolve, reject) { 
    fs.readdir('./', (err, files) => {
      var descriptor = {
          name: dpName,
          resources: []
      };
      files.forEach((file) => {
        if (path.extname(file) == ".csv") {
          var name = path.basename(file, '.csv').replace(/ /g, "-").toLowerCase();
          fs.readFile(file, (err, data) => {
            if(err) throw reject(err)
            parse(data, (error, values) => {
              if(error) throw reject(error)
              var headers = values.shift()
                , schema = infer(headers, values) 
                descriptor.resources.push(
                  { 
                  "path" : file,
                  "name" : name,
                  "format": "csv",
                  "schema": schema
                }
                )
            })
            
            resolve(descriptor);   
          })
        } else if (path.extname(file) == ".json") {
          var name = path.basename(file, '.json').replace(/ /g, "-").toLowerCase()
          descriptor.resources.push(
            { 
              "path" : file,
              "name" : name,
              "format": "json"
            }
          )
        } else if (path.extname(file) == ".geojson") {
          var name = path.basename(file, '.geojson').replace(/ /g, "-").toLowerCase()
          descriptor.resources.push(
            { 
              "path" : file,
              "name" : name,
              "format": "geojson"
            }
          )       
        } else if (path.extname(file) == ".topojson") {
          var name = path.basename(file, '.topojson').replace(/ /g, "-").toLowerCase()
          descriptor.resources.push(
            { 
              "path" : file,
              "name" : name,
              "format": "topojson"
            }
          )
        }
      })
    })  
  })
}
module.exports.generateDescriptorForLocalFiles = generateDescriptorForLocalFiles


