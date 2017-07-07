const Datapackage = require('datapackage').Datapackage
const utils = require('./utils/identifier')

const validate = async (pkgid) => {
  const idObj = utils.parseIdentifier(pkgid)
  let dpObj
  if (idObj.dataPackageJsonPath.charAt(0) === '/') {
    dpObj = await new Datapackage('datapackage.json')
  } else {
    dpObj = await new Datapackage(idObj.dataPackageJsonPath)
  }
  return dpObj.valid
}

module.exports.validate = validate
