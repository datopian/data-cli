const axios = require('axios')
const creds = require('./config')
const crypto = require('crypto')
const fs = require('fs')
const { logger } = require('./utils/log-handler')
const { checkDpIsThere } = require('./utils/common')
const { spinner } = require('./utils/tools')
const path = require('path')
const request = require('request-promise-native')
const urljoin = require('url-join')


const push = async() => {
  spinner.start()
  const config = creds.readConfig()
  if (!config) {
    logger('Config file not found. Run data cofig', 'abort', 'true')
  }
  if (!checkDpIsThere()) {
    console.error('datapckage.json not found!')
    process.exit(1)
  }
  const dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  const token = await getToken(config)
  const files = getFileList(dpjson)
  const infoForRequest = getFilesForRequest(files, config.username, dpjson.name)
  const fileData = await getFileData(config, infoForRequest, token)

  let uploads = []
  files.forEach(file => {
    uploads.push(uploadFile(file, fileData[file]))
  })

  await Promise.all(uploads)
  // do finalize here
  let dataPackageS3Url = urljoin(
    fileData['datapackage.json']['upload_url'],
    fileData['datapackage.json']['upload_query']['key']
  )
  const response = await finalize(config, dataPackageS3Url, token)

  if(response.status !== 'queued') {
    logger('server did not provide upload authorization for files', 'error', true)
  }
  const message = '🙌  your Data Package is published!\n'
  const url = '🔗  ' + urljoin(config.server, config.username, dpjson.name)
  spinner.stop()
  logger(message + url, 'success')

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
      const statusCodes = [400, 404, 403, 500]
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
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
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
  const hash = crypto.createHash('md5')
    .update(fs.readFileSync(fileName))
    .digest("base64")

  return {
    size: size,
    md5: hash,
    type: fileType,
    name: fileName
  }
}

const getFileList = (dpjson) => {
  let fileList = ['datapackage.json']
  const readmes = ['README', 'README.txt', 'README.md']
  const resources = dpjson.resources
  let readme = readmes.filter(readme => {
    return fs.existsSync(readme)
  })
  fileList = fileList.concat(readme)
  resources.forEach(resource => {
    if (resource.path) {
      fileList.push(resource.path)
    }
  })
  return fileList
}

const getFilesForRequest = (files, owner, packageName) => {
  let fileData = {}
  files.forEach(file => {
    fileData[file] = getFileInfo(file)
  })
  let filesForRequest = {
      metadata: {
          owner: owner,
          name: packageName
      },
      filedata: fileData
  }
  return filesForRequest
}

const uploadFile = async (filePath, data) => {
  // file should be the part of formData
  data.upload_query.file = fs.createReadStream(filePath)
  const postQuery = {
    url: data.upload_url,
    formData: data.upload_query
  }
  try {
    await request.post(postQuery)
  } catch (err) {
    logger(err.message, 'error', true)
  }
}

const finalize = async (config, dataPackageS3Url, token) => {
  const url = urljoin(config.server,'/api/package/upload')
  const headers = {'Auth-Token': token}
  const postQuery = {
    url: url,
    headers: headers,
    json: {
      'datapackage': dataPackageS3Url
    }
  }
  try {
    let response = await request.post(postQuery)
    return response
  } catch (err) {
    logger(err.message, 'error', true)
  }
}

module.exports.push = push
module.exports.finalize = finalize
module.exports.getFileData = getFileData
module.exports.getFileInfo = getFileInfo
module.exports.getFileList = getFileList
module.exports.getFilesForRequest = getFilesForRequest
module.exports.getToken = getToken
module.exports.uploadFile = uploadFile
