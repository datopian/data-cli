const fs = require('fs')

const urljoin = require('url-join')
const axios = require('axios')

const config = require('../config')
const {spinner} = require('./tools')
const { logger } = require('./log-handler')


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
module.exports.checkDpIsThere = checkDpIsThere
module.exports.getMetadata = getMetadata
module.exports.getToken = getToken

