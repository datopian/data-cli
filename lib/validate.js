const Datapackage = require('datapackage').Datapackage
const utils = require('./utils/common')

const validate = async (pkgid='datapackage.json') => {
  const idObj = utils.parseIdentifier(pkgid)
  const dpObj = await new Datapackage(idObj.dataPackageJsonPath)
  return dpObj.valid
}

module.exports.validate = validate
