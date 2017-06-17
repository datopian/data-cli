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
        logger(err.message+'\n', 'abort')
        reject(err)
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
const scanDir = (path_) => {
  return new Promise( (resolve, reject) => {
    let filesAndDirs = {
      files: [],
      dirs: []
    }
    fs.readdir(path_, (err, files) => {
      if (err) {
        reject(err)
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
  if (path.extname(path_) === ".csv"){
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
* function to update/extend a datapackage.json
* @param none - does not take any parameters
* @return undefined - does not return anything explicitely
*/
const updateDp = async () => {
  let schemaForConfirmationDp = {
   properties: {
     answer: {
       description: 'There is datapackage.json already. Do you want to update it ' + ' y/n?',
       pattern: /^[y,n]+$/,
       message: `Please, provide with following responses 'y' for yes or 'n' for no`,
       required: true
     }
   }
  }

  let result = await promptFunction(schemaForConfirmationDp)
  if(result.answer === 'y'){
    const dpObj = await new Datapackage('datapackage.json')
    let path_ = process.cwd()
    let filesAndDirs = await scanDir(path_)
    await scanFiles(filesAndDirs, dpObj)
    await scanDirs(filesAndDirs, dpObj)
    await writeDp(dpObj)
  }
  else {
    logger(`Process cancelled\n`, 'abort', true)
  }
}

/*
* function to create datapackage.json file
* @param none - does not take any parameters
* @return undefined - does not return anything explicitely
*/
const createDp = async () => {
  // intro messages:
  console.log('This process initializes a new datapackage.json file.')
  console.log('Once there is a datapackage.json file, you can still run `data init` to update/extend it.')
  console.log('Press ^C at any time to quit.')

  // define schema for prompt
  let schemaForNameAndTitle = {
   properties: {
     name: {
       description: 'Enter Data Package name',
       pattern: /^[a-z\.\-\_]+$/,
       message: `Must consist only of lowercase alphanumeric characters plus ".", "-" and "_"`,
       required: true
     },
     title: {
       description: 'Enter Data Package title',
       required: false
     }
   }
  }
  let result = await promptFunction(schemaForNameAndTitle)

  let descriptor = {
      name: result.name,
      title: result.title,
      resources: []
  }
  const dpObj = await new Datapackage(descriptor)

  let path_ = process.cwd()
  let filesAndDirs = await scanDir(path_)
  await scanFiles(filesAndDirs, dpObj)
  await scanDirs(filesAndDirs, dpObj)
  await writeDp(dpObj)
}

/*
* main function init
* @param {dpName} by default = "scratchpad"
* @return it extends datapackage.json
*/
const init = async (dpName = "scratchpad")=> {
  if(checkDpIsThere()){
    updateDp()
  } else {
    createDp()
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
