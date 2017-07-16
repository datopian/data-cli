const urljoin = require('url-join')
const identifier = require('datapackage-identifier')

// TODO: 2017-07-08 set this in config and use from there
export const PACKAGE_STORE_URL = 'https://pkg.datahub.io'

export const parseIdentifier = dpId => {
  if (dpId && dpId !== '.' && dpId.indexOf('http') === -1) {
    const dpIdArray = dpId.split('/')
    // Remove `/` in the beginning and in the end
    // eslint-disable-next-line no-unused-expressions
    dpId[0] === '/' ? dpIdArray.shift() : undefined
    // eslint-disable-next-line no-unused-expressions
    dpId[dpId.length - 1] === '/' ? dpIdArray.pop() : undefined
    // Get owner, name and resourcePath
    const [owner, name] = dpIdArray
    const resourcePath = dpIdArray.slice(2).join('/')
    // For now assuming version is always 'latest'
    const version = 'latest'
    const path = urljoin(PACKAGE_STORE_URL, 'metadata', owner, name, '_v', version)
    return {
      owner,
      name,
      resourcePath,
      path,
      dataPackageJsonPath: urljoin(path, 'datapackage.json'),
      type: 'datahub',
      original: dpId,
      version
    }
  }  // If not datahub pkg id then use upstream library:
  let idObject
    // If dpId is not given then use cwd
  if (!dpId || dpId === '.') {
    dpId = './'
    idObject = identifier.parse(dpId)
    idObject.owner = null
    idObject.type = 'local'
    idObject.dataPackageJsonUrl = urljoin(idObject.path, 'datapackage.json')
  } else {
    idObject = identifier.parse(dpId)
    const dpIdArray = dpId.split('/')
      // Add 'owner' attr that is github user (for github) and null for random url
    if (dpIdArray[2] === 'github.com') {
      idObject.owner = dpIdArray[3]
      idObject.type = 'github'
    } else {
      idObject.owner = null
      idObject.type = 'url'
    }
      // Replace 'url' attr with 'path'
    idObject.path = idObject.url
  }
  delete idObject.url
    // Replace 'dataPackageJsonUrl' attr with 'dataPackageJsonPath'
  idObject.dataPackageJsonPath = idObject.dataPackageJsonUrl
  delete idObject.dataPackageJsonUrl
    // Remove 'originalType' attr
  delete idObject.originalType
  return idObject
}
