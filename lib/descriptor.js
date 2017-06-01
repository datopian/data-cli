const parse = require('csv-parse')
const infer = require('tableschema').infer
const fs = require('fs')
const path = require('path')

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

const generateDescriptorForLocalFiles = (dpName = "scratchpad") => { 
  return new Promise( (resolve, reject) => { 
    fs.readdir('./', (err, files) => {
      let descriptor = {
          name: dpName,
          resources: []
      };
      files.forEach((file) => {
        let name;
        switch(path.extname(file)) {
          case ".csv":
            name = path.basename(file, '.csv').replace(/ /g, "-").toLowerCase();
            fs.readFile(file, (err, data) => {
              if(err) throw reject(err)
              parse(data, (error, values) => {
                if(error) throw reject(error)
                let headers = values.shift()
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
            break;
          case ".json":
            name = path.basename(file, '.json').replace(/ /g, "-").toLowerCase()
            descriptor.resources.push(
              { 
                "path" : file,
                "name" : name,
                "format": "json"
              }
            )
            break;  
          case ".geojson":
            name = path.basename(file, '.geojson').replace(/ /g, "-").toLowerCase()
            descriptor.resources.push(
              { 
                "path" : file,
                "name" : name,
                "format": "geojson"
              }
            )
            break; 
          case ".topojson":
            name = path.basename(file, '.topojson').replace(/ /g, "-").toLowerCase()
            descriptor.resources.push(
              { 
                "path" : file,
                "name" : name,
                "format": "topojson"
              }
            )
            break;
        }
      })
    })  
  })
}
module.exports.generateDescriptorForLocalFiles = generateDescriptorForLocalFiles


