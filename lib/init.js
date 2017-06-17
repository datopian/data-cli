const fs = require('fs')
const path = require('path')
const prompt = require('prompt')
const { logger } = require('./utils/log-handler.js')
const Datapackage = require('datapackage').Datapackage
const parse = require('csv-parse/lib/sync')
const infer = require('tableschema').infer
const checkDpIsThere = require('./utils/common.js').checkDpIsThere

// 1. check CWD for datapackage.json
// 2. Prompt for name and title DONE
// 3. Validate given name DONE
// 4. Read CWD for files and directories DONE
// 5.1 Prompt to user if files should be added
// 5.2 Prompt to user if directory should be scanned
// 6. Add files to resources
// 7. Print success message 


/*
 * function to prompt to user
 * @param {Schema} as schema per prompt lib documentation
 * @return {Object} result of user prompt(e.g: name can be accessed by result.name)
 */
const promptFunction = (schema) => {
  prompt.start()
  return new Promise((resolve, reject) => {
    prompt.get(schema, (err, result) => {
      if (err) {
        logger(err.message+'\n', 'error')
        reject(false)
      }
      resolve(result)
    })
  })  
}
/*
 * function to scan directory
 * @param {path} as path to directory
 * @return {Object} object with 2 properties -  files and dirs
 */
const scanDir = async (path_) => {
  return new Promise( (resolve, reject) => { 
    let filesAndDirs = {
      files: [],
      dirs: []
    }
    fs.readdir(path_, function(err, files) {
      if (err) {
      return;
      }
      files.forEach((file) => {
        let stats = fs.lstatSync(path_ + file)
        if(stats.isDirectory()) {
          filesAndDirs.dirs.push(file)
        }
        else {
          filesAndDirs.files.push(file)
        } 
      })
      resolve(filesAndDirs)
    })
  })
}


/*
 * function to add resource to datapackage object
 * @param {path_} as path to file
 * @param {dpObj} as datapackage class instance
 * @return it does not explicitely return anything but it modifies a given param
 */
const addResource = async (path_, dpObj) => {
  // take only file name
  let name = path_.replace(/^.*[\\\/]/, '')
  // remove file extension
  name = name.replace(/\.[^/.]+$/, "")
  if (path.extname(path_) === ".csv" || ""){
    let schema = await buildSchema(path_)
    dpObj.addResource({path: path_, name: name, schema: schema})
  }
  else {
    dpObj.addResource({path: path_, name: name})
  }
}
/*
 * function to generate schema for tabular data
 * @param {path_} as path to file
 * @return schema
 */
const buildSchema = (path_) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path_, (err, data) => {
      let values = parse(data)
      var headers = values.shift()
         , schema = infer(headers, values)
      resolve(schema)
    })
  })
}
/*
* function to loop through list of files
* @param {filesAndDirs} object with 2 properties -  files and dirs
* @param {dpObj} instance of the datapackage
* @return it does not explicitely return anything but it modifies a given param {dpObj}
*/
const scanFiles = async (filesAndDirs,dpObj) => {
  for (let i = 0; i < filesAndDirs.files.length; i++){
    let schemaForFiles = {
     properties: {
       answer: {
         description: 'Do you want to proceed ' + filesAndDirs.files[i] + ' y/n?',
         pattern: /^[y,n]+$/,
         message: `Please, provide with following responces 'y' for yes or 'n' for no`,
         required: true
       }
     }
    }
    let result = await promptFunction(schemaForFiles)
    if(result.answer === 'y'){
      let pathForResource = filesAndDirs.files[i]
      addResource(pathForResource, dpObj)
      logger(filesAndDirs.files[i] + ' just added to resources')
    }
    else{
      console.log('skipped')
    }
  }
}
/*
* function to loop through files inside directory
* @param {filesAndDirs} object with 2 properties -  files and dirs
* @param {dpObj} instance of the datapackage
* @return it does not explicitely return anything but it modifies a given param {dpObj}
*/
const scanDirs = async (filesAndDirs,dpObj) => {
  for (let j = 0; j < filesAndDirs.dirs.length; j++) {
    let schemaForDirs = {
     properties: {
       answer: {
         description: 'Do you want to scan ' + filesAndDirs.dirs[j] + ' y/n?',
         pattern: /^[y,n]+$/,
         message: `Please, provide with following responces 'y' for yes or 'n' for no`,
         required: true
       }
     }
    }
    let result = await promptFunction(schemaForDirs)
    if(result.answer === 'y') {
      let path_ = filesAndDirs.dirs[j] + '/'
      filesAndDirs = await scanDir(path_)
      await scanFiles(filesAndDirs, dpObj)
    }
  }
}
/*
* function to write/extend dpObj into datapackage.json
* @param {dpObj} instance of the datapackage
* @return it extends datapackage.json
*/
const writeDp = async (dpObj) => {
  const content = JSON.stringify(dpObj._descriptor, null, 2);
  fs.writeFile("./datapackage.json", content, 'utf8', function (err) {
  if (err) {
      return logger(err);
  }
  logger("The file was saved to current working directory");
  })
}

/*
* main function init
* @param {dpName} by default = "scratchpad" 
* @return it extends datapackage.json
*/
const init = async (dpName = "scratchpad")=> {
  if(checkDpIsThere()){
    let schemaForConfirmationDp = {
     properties: {
       answer: {
         description: 'Do you want us to extend datapackage.json ' + ' y/n?',
         pattern: /^[y,n]+$/,
         message: `Please, provide with following responces 'y' for yes or 'n' for no`,
         required: true
       }
     }
    }
    let result = await promptFunction(schemaForConfirmationDp)
    if(result.answer === 'y'){
      const dpObj = await new Datapackage('datapackage.json')
      let path_ = './'
      let filesAndDirs = await scanDir(path_)
      await scanFiles(filesAndDirs, dpObj)  
      await scanDirs(filesAndDirs, dpObj)
      await writeDp(dpObj)
    }
    else {
      logger(`Process cancelled\n`, 'abort', true)
    }
  }
  else {
    let dpObj1 = {
        name: dpName,
        resources: []
    }
    const dpObj = await new Datapackage(dpObj1)
    logger('there is no data package found', 'warning', true)
    let schemaForName = {
     properties: {
       name: {
         description: 'Enter datapackage name',
         pattern: /^[a-z\.\-\_]+$/,
         message: `Must consist only of lowercase alphanumeric characters plus ".", "-" and "_"`,
         required: true
       },
       title: {
         description: 'Enter datapackage title',
         required: true
       }
     }
    }
    let result = await promptFunction(schemaForName)
    dpObj._descriptor.name = result.name
    dpObj._descriptor.title = result.title
    let path_ = './'
    let filesAndDirs = await scanDir(path_)
    await scanFiles(filesAndDirs, dpObj)  
    await scanDirs(filesAndDirs, dpObj)
    await writeDp(dpObj)
  }  
}
module.exports.init = init
module.exports.promptFunction = promptFunction
module.exports.scanDir = scanDir
module.exports.addResource = addResource
module.exports.buildSchema = buildSchema
module.exports.scanFiles = scanFiles
module.exports.scanDirs = scanDirs
module.exports.writeDp = writeDp


