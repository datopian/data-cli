const urljoin = require('url-join')
const identifier = require('datapackage-identifier')

const config = require('../config')


const parseIdentifier = (dpId) => {
  if(dpId && dpId !== '.' && dpId.indexOf('http') === -1) {
    let dpIdArray = dpId.split('/')
    // remove `/` in the beginning and in the end
    dpId[0] === '/' ? dpIdArray.shift() : void(0)
    dpId[dpId.length - 1] === '/' ? dpIdArray.pop() : void(0)
    // get owner, name and resourcePath
    const [ owner, name ] = dpIdArray
    const resourcePath = dpIdArray.slice(2).join('/')
    // for now assuming version is always 'latest'
    const version = 'latest'
    const path = urljoin(getBitStoreUrl(), 'metadata', owner, name, '_v', version)
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
  } else { // if not datahub pkg id then use upstream library:
    let idObject
    // if dpId is not given then use cwd
    if(!dpId || dpId === '.') {
      dpId = './'
      idObject = identifier.parse(dpId)
      idObject['owner'] = null
      idObject['type'] = 'local'
      idObject['dataPackageJsonUrl'] = urljoin(idObject['path'], 'datapackage.json')
    } else {
      idObject = identifier.parse(dpId)
      let dpIdArray = dpId.split('/')
      // add 'owner' attr that is github user (for github) and null for random url
      if (dpIdArray[2] === 'github.com') {
        idObject['owner'] = dpIdArray[3]
        idObject['type'] = 'github'
      } else {
        idObject['owner'] = null
        idObject['type'] = 'url'
      }
      // replace 'url' attr with 'path'
      idObject['path'] = idObject['url']
    }
    delete idObject['url']
    // replace 'dataPackageJsonUrl' attr with 'dataPackageJsonPath'
    idObject['dataPackageJsonPath'] = idObject['dataPackageJsonUrl']
    delete idObject['dataPackageJsonUrl']
    // remove 'originalType' attr
    delete idObject['originalType']
    return idObject
  }
}

const getBitStoreUrl = (path=config.configDir) => {
  const conf = config.readConfig(path)
  if (conf) {
    return conf.bitStore
  }
  return config.defaultBitStore
}


module.exports.parseIdentifier = parseIdentifier

