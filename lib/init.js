const fs = require('fs')
const path = require('path')
const Datapackage = require('datapackage').Datapackage
const parse = require('csv-parse/lib/sync')
const infer = require('tableschema').infer
const urljoin = require('url-join')
const inquirer = require('inquirer')

const checkDpIsThere = require('./utils/common').checkDpIsThere

/*
 * Function to scan directory
 * @param {path} as path to directory
 * @return {Object} object with 2 properties -  files and dirs
 */
const scanDir = (path_ = './') => {
  return new Promise((resolve, reject) => {
    const filesAndDirs = {
      files: [],
      dirs: []
    }
    fs.readdir(path_, (err, files) => {
      if (err) {
        reject(err)
        return
      }
      files.forEach(file => {
        const stats = fs.lstatSync(urljoin(path_, file))
        if (stats.isDirectory()) {
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
 * Function to add resource to datapackage object
 * @param {path_} as path to file
 * @param {dpObj} as datapackage class instance
 * @return it does not explicitely return anything but it modifies a given param
 */
const addResource = async (path_, dpObj) => {
  // Take file name
  // eslint-disable-next-line no-useless-escape
  const fileName = path_.replace(/^.*[\\\/]/, '')
  // Get file extension and get resource name by removing extension
  const extension = path.extname(fileName)
  const resourceName = fileName.replace(extension, '')
  const format = extension.slice(1)
  // Build schema for tabluar resources
  if (extension === '.csv') {
    const schema = await buildSchema(path.join(dpObj._basePath, path_))
    dpObj.addResource({path: path_, name: resourceName, format, schema})
  } else {
    dpObj.addResource({path: path_, name: resourceName, format})
  }
}

/*
 * Function to generate schema for tabular data
 * @param {path_} as path to file
 * @return schema
 */
const buildSchema = path_ => {
  return new Promise((resolve, reject) => {
    fs.readFile(path_, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      const values = parse(data)
      const schema = infer(values)
      resolve(schema)
    })
  })
}

/*
* Function to loop through list of files
* @param {filesAndDirs} object with 2 properties -  files and dirs
* @param {dpObj} instance of the datapackage
* @return it does not explicitely return anything but it modifies a given param {dpObj}
*/
const shouldAddFiles = async (files, dpObj, currentPath) => {
  // Make array of resource pathes so we can check if a resource already included
  // in a data package.
  const arrayOfResourceNames = dpObj.descriptor.resources.map(resource => {
    // eslint-disable-next-line no-useless-escape
    return resource.path.replace(/^.*[\\\/]/, '')
  })
  for (let i = 0; i < files.length; i++) {
    // Check if file is already included
    if (arrayOfResourceNames.indexOf(files[i]) === -1) {
      const questions = [
        {
          type: 'input',
          name: 'answer',
          message: `Do you want to add following file as a resource "${files[i]}" - y/n?`,
          validate: value => {
            const pass = value.match(/^[y,n]+$/)
            if (pass) {
              return true
            }
            return `Please, provide with following responses 'y' for yes or 'n' for no`
          }
        }
      ]
      const result = await inquirer.prompt(questions)
      if (result.answer === 'y') {
        const pathForResource = path.join(currentPath, files[i])
        await addResource(pathForResource, dpObj)
        console.log(`${files[i]} is just added to resources`)
      } else {
        console.log(`Skipped ${files[i]}`)
      }
    } else {
      console.log(`Skipping ${files[i]} as it is already in the datapackage.json`)
    }
  }
}

/*
* Function to loop through files inside directory
* @param {filesAndDirs} object with 2 properties -  files and dirs
* @param {dpObj} instance of the datapackage
* @return it does not explicitely return anything but it modifies a given param {dpObj}
*/
const shouldScanDir = async (dirs, dpObj, currentPath) => {
  for (let j = 0; j < dirs.length; j++) {
    const questions = [
      {
        type: 'input',
        name: 'answer',
        message: `Do you want to scan following directory "${dirs[j]}" - y/n?`,
        validate: value => {
          const pass = value.match(/^[y,n]+$/)
          if (pass) {
            return true
          }
          return `Please, provide with following responses 'y' for yes or 'n' for no`
        }
      }
    ]
    const result = await inquirer.prompt(questions)

    if (result.answer === 'y') {
      const nextPath = path.join(currentPath, dirs[j])
      const filesAndDirs = await scanDir(nextPath)
      // Add resources if needed:
      await shouldAddFiles(filesAndDirs.files, dpObj, nextPath)
      // If there are dirs in this dir then recurse:
      if (filesAndDirs.dirs.length > 0) {
        await shouldScanDir(filesAndDirs.dirs, dpObj, nextPath)
      }
    }
  }
}

/*
* Function to ask if it should write datapackage.json
* @param {descriptor} descriptor of the datapackage
* does not return anything but stops the process depending on user's input
*/
const shouldWrite = async descriptor => {
  const cwd = path.join(process.cwd(), 'datapackage.json')
  const questions = [
    {
      type: 'input',
      name: 'answer',
      message: `Going to write to ${cwd}:\n\n${JSON.stringify(descriptor, null, 2)} \n\n\nIs that OK - y/n?`,
      validate: value => {
        const pass = value.match(/^[y,n]+$/)
        if (pass) {
          return true
        }
        return `Please, provide with following responses 'y' for yes or 'n' for no`
      }
    }
  ]
  const result = await inquirer.prompt(questions)
  if (result.answer === 'n') {
    throw new Error(`Process cancelled`)
  }
}

/*
* Function to write/extend dpObj into datapackage.json
* @param {dpObj} instance of the datapackage
* it wrties datapackage.json file to the disk
*/
const writeDp = async (dpObj, log = true) => {
  const cwd = path.join(process.cwd(), 'datapackage.json')
  const content = JSON.stringify(dpObj._descriptor, null, 2)
  fs.writeFile('./datapackage.json', content, 'utf8', err => {
    if (err) {
      throw new Error(err)
    }
    if (log) {
      console.log(`datapackage.json file is saved in ${cwd}`)
    }
  })
}

/*
* Function to update/extend a datapackage.json
* @param none - does not take any parameters
* @return undefined - does not return anything explicitely
*/
const updateDp = async () => {
  // Intro messages:
  console.log('This process updates existing datapackage.json file.')
  console.log('\nPress ^C at any time to quit.\n')

  const questions = [
    {
      type: 'input',
      name: 'answer',
      message: `There is datapackage.json already. Do you want to update it - y/n?`,
      validate: value => {
        const pass = value.match(/^[y,n]+$/)
        if (pass) {
          return true
        }
        return `Please, provide with following responses 'y' for yes or 'n' for no`
      }
    }
  ]
  const result = await inquirer.prompt(questions)
  if (result.answer === 'y') {
    const dpObj = await new Datapackage('datapackage.json')
    const path_ = ''
    const filesAndDirs = await scanDir()
    await shouldAddFiles(filesAndDirs.files, dpObj, path_)
    await shouldScanDir(filesAndDirs.dirs, dpObj, path_)
    await shouldWrite(dpObj._descriptor)
    await writeDp(dpObj)
  } else {
    console.log(`Process canceled\n`)
  }
}

/*
* Function to create datapackage.json file
* @param none - does not take any parameters
* @return undefined - does not return anything explicitely
*/
const createDp = async () => {
  // Intro messages:
  console.log('This process initializes a new datapackage.json file.')
  console.log('\nOnce there is a datapackage.json file, you can still run `data init` to update/extend it.')
  console.log('\nPress ^C at any time to quit.\n')

  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Enter Data Package name',
      default: () => {
        return 'scratchpad'
      },
      validate: value => {
        // eslint-disable-next-line no-useless-escape
        const pass = value.match(/^[a-z\.\-\_]+$/)
        if (pass) {
          return true
        }
        return `Must consist only of lowercase alphanumeric characters plus ".", "-" and "_"`
      }
    },
    {
      type: 'input',
      name: 'title',
      message: 'Enter Data Package title'
    }
  ]
  const result = await inquirer.prompt(questions)
  const descriptor = {
    name: result.name,
    title: result.title,
    resources: []
  }
  const dpObj = await new Datapackage(descriptor)
  const path_ = ''
  const filesAndDirs = await scanDir()
  await shouldAddFiles(filesAndDirs.files, dpObj, path_)
  await shouldScanDir(filesAndDirs.dirs, dpObj, path_)
  await shouldWrite(dpObj._descriptor)
  await writeDp(dpObj)
}

/*
* Main function init
* @param {dpName} by default = "scratchpad"
* @return it extends datapackage.json
*/
const init = async () => {
  if (checkDpIsThere()) {
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
