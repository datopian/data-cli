const util = require('util')

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

const normalizeSchema = (dp)=>{
  for (let key in dp) {
    let value = dp[key];
    let file = ('dppackage.json')
    if (dp[key].constructor == Object){
      dp[key] = [dp[key]]
    }
  }
  return dp
}
module.exports.normalizeSchema = normalizeSchema

const nomralizeDateFormat = (dp) => {
  for (let key1 in dp.resources){
    let value1 = dp.resources[key1]
    for (let key2 in value1.schema.fields){
      let value2 = value1.schema.fields[key2]
      if (value2.type == 'date') {
        value2.format = 'any'
      }
    } 
  }
  return dp
}
module.exports.nomralizeDateFormat = nomralizeDateFormat

const normalizeType = (dp) => {
  for (let key1 in dp.resources){
    let value1 = dp.resources[key1]
    for (let key2 in value1.schema.fields){
      let value2 = value1.schema.fields[key2]
      let unsupported_number_types = ['decimal', 'double', 'float']
      for (let i = 0; i < unsupported_number_types.length; i++) {
        if (unsupported_number_types[i] === value2.type) {
          value2.type = 'number'
        }
      }
    } 
  }
  return dp
}
module.exports.normalizeType = normalizeType

const normalizeResourceName  = (dp) => {
  for (let key1 in dp.resources){
    dp.resources[key1].name = dp.resources[key1].name.toLowerCase().replace(' ', '-')
  }
  return dp
}
module.exports.normalizeResourceName = normalizeResourceName


const normalizeAll = (dp) => {
  dp = normalizeSchema(dp) 
  dp = nomralizeDateFormat(dp)
  dp = normalizeType(dp)
  dp = normalizeResourceName(dp)
  return dp
}
module.exports.normalizeAll = normalizeAll

