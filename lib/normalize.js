/*
This script is used to fix commmon issues for datapackage.json, like changing yet
unsupported date formats for fields with type date, or unsupported types for
numeric fields.
Script also fixes commonly made mistake while creating datapackage.json. According
to Frictionless dp spec metadata describing data should not directly be objects,
but elements of the list Eg:

## Bad
{
  "name": "example",
  "licenses": {
    "name": "example license",
    "url": "https://example/license.com"
  }
}
## Good
{
  "name": "example",
  "licenses": [
    {
    "name": "example license",
    "url": "https://example/license.com"
    }
  ]
}
*/
const fs = require('fs')
const { join } = require('path')
const { logger } = require('./utils/log-handler')

const normalizeSchema = (dp)=>{
  for (let propertyName in dp) {
    let property = dp[propertyName]
    if (dp[propertyName].constructor === Object){
      dp[propertyName] = [dp[propertyName]]
    }
  }
  return dp
}

const nomralizeDateFormat = (dp) => {
  for (let resourceName in dp.resources){
    let resource = dp.resources[resourceName]
    for (let fieldName in resource.schema.fields){
      let field = resource.schema.fields[fieldName]
      if (field.type === 'date') {
        field.format = 'any'
      }
    }
  }
  return dp
}

const normalizeType = (dp) => {
  for (let resourceName in dp.resources){
    let resource = dp.resources[resourceName]
    for (let fieldName in resource.schema.fields){
      let field = resource.schema.fields[fieldName]
      let unsupportedNumberTypes = ['decimal', 'double', 'float']
      if (unsupportedNumberTypes.indexOf(field.type) > -1) {
        field.type = 'number'
      }
    }
  }
  return dp
}

const normalizeNames = (dp) => {
  for (let resourceName in dp.resources){
    dp.resources[resourceName].name = dp.resources[resourceName].name.toLowerCase().replace(' ', '-')
  }
  dp.name = dp.name.toLowerCase().replace(' ', '-')
  return dp
}


const normalizeAll = (dp) => {
  dp = normalizeSchema(dp)
  dp = nomralizeDateFormat(dp)
  dp = normalizeType(dp)
  dp = normalizeNames(dp)
  return dp
}

const normalize = (path) => {
  const writeDatapackage = (dp) => {
    fs.writeFile(path, JSON.stringify(dp, null, 2),  (err) => {
      if (err) {
          console.error(err.message)
          return
      }
      logger("Datapackage.json has been normalized")
    })
  }

  const readDatapackage = (path) => {
    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'))
    }
    catch(err) {
      logger('datapackage.json not found', 'error', true)
    }
  }

  if(!path){
    path = 'datapackage.json'
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  } else {
    try {
      if(fs.lstatSync(path).isFile()){
        let dp = readDatapackage(path)
        normalizeAll(dp)
        writeDatapackage(dp)
      }
      else {
        path = join(path,'datapackage.json')
        let dp = readDatapackage(path)
        normalizeAll(dp)
        writeDatapackage(dp)
      }
    } catch (err) {
      logger('Invalid path', 'error', true)
    }
  }
}

module.exports.normalize = normalize
module.exports.normalizeAll = normalizeAll
module.exports.nomralizeDateFormat = nomralizeDateFormat
module.exports.normalizeNames = normalizeNames
module.exports.normalizeSchema = normalizeSchema
module.exports.normalizeType = normalizeType
