const validator = require('datapackage').validate

const validateDp = async (descriptor) => {
  try {
    const valid = await validator(descriptor)
    return valid
  } catch (errors) {
    for (const error of errors) {
      console.error(error.message)
    }
    return false
  }
}

module.exports.validateDp = validateDp
