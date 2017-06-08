const validator = require('datapackage').validate
const chalk = require('chalk')

const validateDescriptor = async (descriptor) => {
  try {
    const valid = await validator(descriptor)
    return valid
  } catch (errors) {
    if(errors.message) {
      console.error(chalk.red('Error: ') + 'check if path/url to descriptor is valid.')
      process.exit(1)
    }
    for (const error of errors) {
      console.error(chalk.red('Error: ') + error.message)
    }
    return false
  }
}

const validate = async (descriptor='datapackage.json') => {
  let valid = await validateDescriptor(descriptor)
  if(valid) {
    console.log(chalk.green('Descriptor is valid!'))
  } else {
    console.log(chalk.bgRed.yellow(' Descriptor is invalid. '))
  }
}

module.exports.validateDescriptor = validateDescriptor
module.exports.validate = validate
