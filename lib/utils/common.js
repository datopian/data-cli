const axios = require('axios')
const config = require('../config')
const fs = require('fs')
const urljoin = require('url-join')
const {spinner} = require('./tools')
const identifier = require('datapackage-identifier')

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

const getServerUrl = (path=config.configDir) => {
  const conf = config.readConfig(path)
  if (conf) {
    return conf.server
  }
  return config.defaultServer
}

const checkDpIsThere = () => {
  const files = fs.readdirSync(process.cwd())
  return files.indexOf('datapackage.json') > -1
}

const getMetadata = async (publisher, pkg, sUrl=getServerUrl() ) => {
  let apiUrl = `${sUrl}/api/package/${publisher}/${pkg}`
  let res = await axios.get(apiUrl).catch( err => {
    if (err.response && err.response.status === 404) {
      console.error('Data Package Not Found')
      process.exit(1)
    } else {
      console.error(err.message)
      process.exit(1)
    }
  })
  return res.data
}


const getToken = async(config) => {
  spinner.text = 'Authenticating...'
  let res =  await axios.post(
    urljoin(config.server,'/api/auth/token'),
      {
        'username': config.username,
        'secret': config.secretToken
      }
    ).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        logger(`Not able to connect to ${config.server}`, 'error', true, spinner)
      }
      const statusCodes = [400, 404, 403, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        logger(err.response.data.message, 'error', true, spinner)
      }
      logger(err.message, 'error', true, spinner)
    })
  return res.data.token
}

module.exports.getServerUrl = getServerUrl
module.exports.getBitStoreUrl = getBitStoreUrl
module.exports.checkDpIsThere = checkDpIsThere
module.exports.parseIdentifier = parseIdentifier
module.exports.getMetadata = getMetadata
module.exports.getToken = getToken
