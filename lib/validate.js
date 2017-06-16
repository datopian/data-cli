const validator = require('datapackage').validate

const validate = async (descriptor='datapackage.json') => {
  const valid = await validator(descriptor)
  return valid
}

module.exports.validate = validate
