const fs = require('fs');
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
  for (let propertyName in dp) {
    let property = dp[propertyName];
    if (dp[propertyName].constructor === Object){
      dp[propertyName] = [dp[propertyName]]
    }
  }
  return dp
}
module.exports.normalizeSchema = normalizeSchema

const nomralizeDateFormat = (dp) => {
  for (let resourceName in dp.resources){
    let resource = dp.resources[resourceName]
    for (let fieldName in resource.schema.fields){
      let field = resource.schema.fields[fieldName]
      if (field.type == 'date') {
        field.format = 'any'
      }
    } 
  }
  return dp
}
module.exports.nomralizeDateFormat = nomralizeDateFormat

const normalizeType = (dp) => {
  for (let resourceName in dp.resources){
    let resource = dp.resources[resourceName]
    for (let fieldName in resource.schema.fields){
      let field = resource.schema.fields[fieldName]
      let unsupported_number_types = ['decimal', 'double', 'float']
      for (let i = 0; i < unsupported_number_types.length; i++) {
        if (unsupported_number_types[i] === field.type) {
          field.type = 'number'
        }
      }
    } 
  }
  return dp
}
module.exports.normalizeType = normalizeType

const normalizeResourceName  = (dp) => {
  for (let resourceName in dp.resources){
    dp.resources[resourceName].name = dp.resources[resourceName].name.toLowerCase().replace(' ', '-')
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

const normalize = (path) => {
  const writeDatapackage = (dp) => {
    fs.writeFile(path, JSON.stringify(dp, null, 2),  (err) => {
      if (err) {
          console.error(err.message);
          return;
      };
      console.log("Datapackage.json has been normalized");
    });
  }
  
  const readDatapackage = (path) => {
    try {
      return JSON.parse(fs.readFileSync(path, 'utf8'));
    }
    catch(err) {
      console.error(err.message);
      return;
    }
  }  
  if(!path){
    path = './datapackage.json'
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else if(fs.lstatSync(path).isFile()) {
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else if(path.slice(0,-1) != '/'){
    path += '/datapackage.json';
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  }
  else {
    path += 'datapackage.json';
    let dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  } 
}

module.exports.normalize = normalize

