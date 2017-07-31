const fs = require('fs')

const urljoin = require('url-join')
const axios = require('axios')


const checkDpIsThere = (path_ = process.cwd()) => {
  const files = fs.readdirSync(path_)
  return files.indexOf('datapackage.json') > -1
}

const getMetadata = async (publisher, pkg, sUrl) => {
  const apiUrl = `${sUrl}/api/package/${publisher}/${pkg}`
  const res = await axios.get(apiUrl).catch(err => {
    if (err.response && err.response.status === 404) {
      throw new Error('Data Package Not Found')
    } else {
      throw new Error(err.message)
    }
  })
  return res.data
}

const getToken = async config => {
  const res = await axios.post(
    urljoin(config.server, '/api/auth/token'),
    {
      username: config.username,
      secret: config.secretToken
    }
    ).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        // logger(`Not able to connect to ${config.server}`, 'error', true)
      }
      const statusCodes = [400, 404, 403, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        // logger(err.response.data.message, 'error', true)
      }
      // logger(err.message, 'error', true)
    })
  return res.data.token
}

// TODO: should not really be an export but used in tests ...
exports.objectStreamToArray = function (stream) {
  const p = new Promise((resolve, reject) => {
    const output = []
    let row
    stream.on('readable', () => {
      // eslint-disable-next-line no-cond-assign
      while (row = stream.read()) {
        output.push(row)
      }
    })
    stream.on('error', error => {
      reject(error)
    })
    stream.on('finish', () => {
      resolve(output)
    })
  })
  return p
}

module.exports.checkDpIsThere = checkDpIsThere
module.exports.getMetadata = getMetadata
module.exports.getToken = getToken
