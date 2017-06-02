const axios = require('axios')
const fs = require('fs')
const md5File = require('md5-file');
const path = require('path')
const urljoin = require('url-join')

const config = require('./config').readConfig()

module.exports.push = async() => {

}

const checkDpIsThere = () => {
  let files = fs.readdirSync(process.cwd())
  return files.indexOf('datapackage.json') > -1
}

const getToken = async(config) => {
  let res =  await axios.post(
    urljoin(config.server,'/api/auth/token'),
      {
        'username': config.username,
        'secret': config.secretToken
      }
    ).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log(`Not able to connect to ${config.server}`)
        process.exit(1)
      }
      const statusCodes = [404, 403, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data.token
}

const getFileData = async (config, fileInfo, token) => {
  axios.defaults.headers.common['Auth-Token'] = token
  const res = await axios.post(
    urljoin(config.server,'/api/datastore/authorize'),
      fileInfo).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log(`Not able to connect to ${config.server}`)
        process.exit(1)
      }
      const statusCodes = [400, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > 0) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data.filedata
}

const getFileInfo = (fileName) => {
  let fileType = 'binary/octet-stream'
  if (path.extname(fileName) === '.json'){
    fileType = 'application/json'
  }
  const size = fs.statSync(fileName).size
  const hash = md5File.sync(fileName)
  return {
    size: size,
    md5: hash,
    type: fileType,
    name: fileName
  }
}


module.exports.checkDpIsThere = checkDpIsThere
module.exports.getFileData = getFileData
module.exports.getFileInfo = getFileInfo
module.exports.getToken = getToken
