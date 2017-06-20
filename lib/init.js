const fs = require('fs')
const path = require('path')
const Datapackage = require('datapackage').Datapackage
const parse = require('csv-parse/lib/sync')
const infer = require('tableschema').infer
const urljoin = require('url-join')

const { logger } = require('./utils/log-handler')
const checkDpIsThere = require('./utils/common').checkDpIsThere
const prompt = require('./utils/prompt')


/*
 * function to scan directory
 * @param {path} as path to directory
 * @return {Object} object with 2 properties -  files and dirs
 */
const scanDir = (path_='./') => {
  return new Promise( (resolve, reject) => {
    let filesAndDirs = {
      files: [],
      dirs: []
    }
    fs.readdir(path_, (err, files) => {
      if (err) {
        reject(err)
        return
      }
      files.forEach((file) => {
        let stats = fs.lstatSync(urljoin(path_, file))
        if(stats.isDirectory()) {
          filesAndDirs.dirs.push(file)
        } else if (file !== 'datapackage.json') {
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
  // take file name
  const fileName = path_.replace(/^.*[\\\/]/, '')
  // get file extension and get resource name by removing extension
  const extension = path.extname(fileName)
        , resourceName = fileName.replace(extension, "")
        , format = extension.slice(1)
  // build schema for tabluar resources
  if (extension === ".csv"){
    let schema = await buildSchema(path.join(dpObj._basePath, path_))
    dpObj.addResource({path: path_, name: resourceName, format, schema: schema})
  }
  else {
    dpObj.addResource({path: path_, name: resourceName, format})
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
      if (err) {
        reject(err)
        return
      }
      let values = parse(data)
          , headers = values.shift()
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
const shouldAddFiles = async (files, dpObj, currentPath) => {
  // Make array of resource pathes so we can check if a resource already included
  // in a data package.
  const arrayOfResourceNames = dpObj.descriptor.resources.map(resource => {
    return resource.path.replace(/^.*[\\\/]/, '')
  })
  for (let i = 0; i < files.length; i++){
    // check if file is already included
    if(arrayOfResourceNames.indexOf(files[i]) === -1) {
      let schemaForFiles = {
       properties: {
         answer: {
           description: `Do you want to add following file as a resource "${files[i]}" - y/n?`,
           pattern: /^[y,n]+$/,
           message: `Please, provide with following responses 'y' for yes or 'n' for no`,
           required: true
         }
       }
      }
      let result = await prompt.promptFunction(schemaForFiles)
      if(result.answer === 'y'){
        let pathForResource = path.join(currentPath, files[i])
        await addResource(pathForResource, dpObj)
        logger(`${files[i]} is just added to resources`, 'success')
      } else {
        console.log(`Skipped ${files[i]}`)
      }
    } else {
      console.log(`Skipping ${files[i]} as it is already in the datapackage.json`)
    }
  }
}

/*
* function to loop through files inside directory
* @param {filesAndDirs} object with 2 properties -  files and dirs
* @param {dpObj} instance of the datapackage
* @return it does not explicitely return anything but it modifies a given param {dpObj}
*/
const shouldScanDir = async (dirs, dpObj, currentPath) => {
  for (let j = 0; j < dirs.length; j++) {
    let schemaForDirs = {
     properties: {
       answer: {
         description: `Do you want to scan following directory "${dirs[j]}" - y/n?`,
         pattern: /^[y,n]+$/,
         message: `Please, provide with following responses 'y' for yes or 'n' for no`,
         required: true
       }
     }
    }
    let result = await prompt.promptFunction(schemaForDirs)

    if(result.answer === 'y') {
      let nextPath = path.join(currentPath, dirs[j])
      let filesAndDirs = await scanDir(nextPath)
      // add resources if needed:
      await shouldAddFiles(filesAndDirs.files, dpObj, nextPath)
      // if there are dirs in this dir then recurse:
      if(filesAndDirs.dirs.length > 0) {
        await shouldScanDir(filesAndDirs.dirs, dpObj, nextPath)
      }
    }
  }
}

/*
* function to ask if it should write datapackage.json
* @param {descriptor} descriptor of the datapackage
* does not return anything but stops the process depending on user's input
*/
const shouldWrite = async (descriptor) => {
  const cwd = path.join(process.cwd(), 'datapackage.json')
  let schemaForShouldWrite = {
    properties: {
      answer: {
        description: `Going to write to ${cwd}:\n\n${JSON.stringify(descriptor, null, 2)} \n\n\nIs that OK - y/n?`,
        pattern: /^[y,n]+$/,
        message: `Please, provide with following responses 'y' for yes or 'n' for no`,
        required: true
      }
    }
  }

  let result = await prompt.promptFunction(schemaForShouldWrite)

  if(result.answer === 'n') {
    logger(`Process canceled\n`, 'abort', true)
  }
}

/*
* function to write/extend dpObj into datapackage.json
* @param {dpObj} instance of the datapackage
* it wrties datapackage.json file to the disk
*/
const writeDp = async (dpObj) => {
  const cwd = path.join(process.cwd(), 'datapackage.json')
  const content = JSON.stringify(dpObj._descriptor, null, 2);
  fs.writeFile("./datapackage.json", content, 'utf8', function (err) {
  if (err) {
      return logger(err);
  }
  logger(`datapackage.json file is saved in ${cwd}`);
  })
}

/*
* function to update/extend a datapackage.json
* @param none - does not take any parameters
* @return undefined - does not return anything explicitely
*/
const updateDp = async () => {
  // intro messages:
  console.log('This process updates existing datapackage.json file.')
  console.log('\nPress ^C at any time to quit.\n')

  let schemaForConfirmationDp = {
   properties: {
     answer: {
       description: 'There is datapackage.json already. Do you want to update it - y/n?',
       pattern: /^[y,n]+$/,
       message: `Please, provide with following responses 'y' for yes or 'n' for no`,
       required: true
     }
   }
  }

  let result = await prompt.promptFunction(schemaForConfirmationDp)
  if(result.answer === 'y'){
    const dpObj = await new Datapackage('datapackage.json')
    let path_ = ''
    let filesAndDirs = await scanDir()
    await shouldAddFiles(filesAndDirs.files, dpObj, path_)
    await shouldScanDir(filesAndDirs.dirs, dpObj, path_)
    await shouldWrite(dpObj._descriptor)
    await writeDp(dpObj)
  }
  else {
    logger(`Process canceled\n`, 'abort', true)
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
  console.log('\nOnce there is a datapackage.json file, you can still run `data init` to update/extend it.')
  console.log('\nPress ^C at any time to quit.\n')

  // define schema for pr
  let schemaForNameAndTitle = {
   properties: {
     name: {
       description: 'Enter Data Package name',
       pattern: /^[a-z\.\-\_]+$/,
       message: `Must consist only of lowercase alphanumeric characters plus ".", "-" and "_"`,
       default: 'scratchpad',
       required: false
     },
     title: {
       description: 'Enter Data Package title',
       required: false
     }
   }
  }
  let result = await prompt.promptFunction(schemaForNameAndTitle)

  let descriptor = {
      name: result.name,
      title: result.title,
      resources: []
  }
  const dpObj = await new Datapackage(descriptor)
  let path_ = ''
  let filesAndDirs = await scanDir()
  await shouldAddFiles(filesAndDirs.files, dpObj, path_)
  await shouldScanDir(filesAndDirs.dirs, dpObj, path_)
  await shouldWrite(dpObj._descriptor)
  await writeDp(dpObj)
}

/*
* main function init
* @param {dpName} by default = "scratchpad"
* @return it extends datapackage.json
*/
const init = async ()=> {
  if(checkDpIsThere()){
    updateDp()
  } else {
    createDp()
  }
}

module.exports.init = init
module.exports.scanDir = scanDir
module.exports.addResource = addResource
module.exports.buildSchema = buildSchema
module.exports.shouldAddFiles = shouldAddFiles
module.exports.shouldScanDir = shouldScanDir
module.exports.shouldWrite = shouldWrite
module.exports.writeDp = writeDp
module.exports.createDp = createDp
