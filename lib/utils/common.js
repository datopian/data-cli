const axios = require('axios')
const http = require('http')
const https = require('https')
const config = require('../config')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const chardet = require('chardet')
const parse = require('csv-parse')
const urljoin = require('url-join')
const {spinner} = require('./tools')
const identifier = require('datapackage-identifier')
const { logger } = require('./log-handler')


const csvParser = descriptor => {
  // Need to find out delimiter (?)
  if (descriptor.format === 'csv') {
    const parser = parse()
    return parser
  }
}

// Available parsers per file format
const parserDatabase = {
  csv: csvParser
}

export class DataResource {
  constructor(pathOrDescriptor) {
    if (pathOrDescriptor.constructor.name === 'String') {
      this.descriptor = parsePath(pathOrDescriptor)
    } else {
      this.descriptor = pathOrDescriptor
    }
  }

  /**
  * Get readable stream
  * @returns Promise with readable stream object on resolve
  */
  get stream() {
    if (this.descriptor.pathType === 'remote') {
      // create readable stream from remote file
      return (async () => {
        const response = await axios({
          method:'get',
          url: this.descriptor.path,
          responseType:'stream'
        })
        return response.data
      })()
    } else if (this.descriptor.pathType === 'local') {
      return fs.createReadStream(this.descriptor.path)
    } else {
      throw `Unsupported path type: ${this.descriptor.pathType}`
    }
  }

  /**
  * Get rows
  * @returns Promise with parsed JS objects (depends on file format)
  */
  get rows() {
    if (Object.keys(parserDatabase).indexOf(this.descriptor.format) !== -1) {
      const parser = parserDatabase[this.descriptor.format](this.descriptor)
      return this.stream.pipe(parser)
    } else {
      throw "We don't have a parser for that format"
    }
  }
}

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

const parsePath = (path_) => {
  const dataResource = {path: path_}
        , isItUrl = isUrl(path_)
        , fileName = path_.replace(/^.*[\\\/]/, '')
        , extension = path.extname(fileName)
        , resourceName = fileName.replace(extension, "")
        , format = extension.slice(1)
        , mimeType = mime.lookup(path_) || ''
  dataResource.pathType = isItUrl ? 'remote' : 'local'
  dataResource.name = resourceName
  dataResource.format = format
  dataResource.mediatype = mimeType
  if (!isItUrl) {
    const encoding = chardet.detectFileSync(path_)
    dataResource.encoding = encoding
  } else {
    dataResource.encoding = null
  }
  return dataResource
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

const checkDpIsThere = (path_=process.cwd()) => {
  const files = fs.readdirSync(path_)
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

const isUrl = path_ => {
  let r = new RegExp('^(?:[a-z]+:)?//', 'i')
  return r.test(path_)
}

// TODO: should not really be an export but used in tests ...
exports.objectStreamToArray = function(stream, callback) {
  var p = new Promise(function(resolve, reject) {
    var output = [];
    var row
    stream.on('readable', function() {
      while(row = stream.read()) {
        output.push(row);
      }
    });
    stream.on('error', function(error) {
      reject(error);
    });
    stream.on('finish', function() {
      resolve(output);
    });
  });
  return p;
}

module.exports.getServerUrl = getServerUrl
module.exports.getBitStoreUrl = getBitStoreUrl
module.exports.checkDpIsThere = checkDpIsThere
module.exports.parseIdentifier = parseIdentifier
module.exports.parsePath = parsePath
module.exports.getMetadata = getMetadata
module.exports.getToken = getToken
module.exports.isUrl = isUrl
