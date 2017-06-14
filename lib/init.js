
const init = () => {
  
  // 1. check CWD for datapackage.json
  // 2. Prompt for name and title
  // 3. Validate given name
  // 4. Read CWD for files and directories
  // 5.1 Prompt to user if files should be added
  // 5.2 Prompt to user if directory should be scanned
  // 6. Add files to resources
  // 7. Print success message 
}

/**
 * function to prompt to user
 * @param {Schema} as schema per prompt lib documentation
 * @return {Object} result of user prompt(e.g: name can be accessed by result.name)
 */
const promptFunction = () => {
  
}

/**
 * function to scan directory
 * @param {path} as path to directory
 * @return {Object} object with 2 properties -  files and dirs
 */
const scanDir = () => {
  
}

/**
 * function to add resource to dp
 * @param {path} as path to file
 * @param {dp} as datapackage.json
 * @return {Object} object dp with added resource 
 */
const addResource = () => {
  
}

module.exports.init = init
module.exports.promptFunction = promptFunction
module.exports.scanDir = scanDir
module.exports.addResource = addResource



