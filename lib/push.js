const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const axios = require('axios')
const request = require('request-promise-native')
const urljoin = require('url-join')

const Datapackage = require('datapackage').Datapackage

const config = require('./utils/config')
const { logger } = require('./utils/log-handler')
const { checkDpIsThere, getToken } = require('./utils/common')
const { spinner } = require('./utils/tools')
const { addResource, writeDp } = require('./init')


const push = async(filePath) => {
  spinner.text = 'Preparing...'
  spinner.start()
  let dpjson
  // get dpjson
  if(!filePath) {
    if (!checkDpIsThere()) {
      logger('datapckage.json not found!', 'abort', true, spinner)
    }
    dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  } else {
    // prepare temp descriptor for the single file push
    let descriptor = {
        name: filePath.replace(/^.*[\\\/]/, ''),
        resources: []
    }
    const dpObj = await new Datapackage(descriptor)
    try {
      await addResource(filePath, dpObj)
    } catch (err) {
      logger(err.message, `error`, true, spinner)
    }
    await writeDp(dpObj, false)
    dpjson = dpObj._descriptor
  }

  const files = getFileList(dpjson)
  const infoForRequest = getFilesForRequest(files, config.get('username'), dpjson.name)
  const fileData = await getFileData(config, infoForRequest)
  // upload
  let uploads = []
  files.forEach(file => {
    uploads.push(uploadFile(file, fileData[file]))
  })
  await Promise.all(uploads)

  // Upload to SpecStore
  const responseFromSpecStore = await uploadToSpecSource(config, fileData, dpjson.resources)
  if (!responseFromSpecStore.success) {
    logger('server did not provide upload authorization for files', 'error', true, spinner)
  }
  const message = '🙌  your Data Package is published!\n'
  const url = '🔗  ' + urljoin(config.get('domain'), config.get('username'), dpjson.name)
  logger(message + url, 'success', false, spinner)
  // delete temporary created datapackage.json
  if (filePath) {
    fs.unlinkSync('datapackage.json')
  }
}

const getFileData = async (config, fileInfo) => {
  spinner.text = 'Authorizing...'
  axios.defaults.headers.common['Auth-Token'] = config.get('token')
  const res = await axios.post(
    urljoin(config.get('api'),'/rawstore/authorize'),
      fileInfo).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        logger(`Not able to connect to ${config.get('api')}`, 'error', true, spinner)
      }
      const statusCodes = [400, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        logger(err.response.data.message, 'error', true, spinner)
      }
      logger(err.message, 'error', true, spinner)
    })
  return res.data.filedata
}

const getFileInfo = (fileName) => {
  let fileType = 'binary/octet-stream'
  if (path.extname(fileName) === '.json'){
    fileType = 'application/json'
  }

  let length, hash
  try {
    length = fs.statSync(fileName).size
    hash = crypto.createHash('md5')
      .update(fs.readFileSync(fileName))
      .digest("base64")
  } catch (err) {
    logger(err.message, 'error', true, spinner)
  }

  return {
    length: length,
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
  spinner.text = 'Uploading...'
  // file should be the part of formData
  data.upload_query.file = fs.createReadStream(filePath)
  const postQuery = {
    url: data.upload_url,
    formData: data.upload_query
  }
  try {
    await request.post(postQuery)
    logger('Files are uploaded!', 'success')
  } catch (err) {
    logger(err.message, 'error', true, spinner)
  }
}

const finalize = async (config, dataPackageS3Url, token) => {
  spinner.text = 'Finalizing...'
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
    logger(err.message, 'error', true, spinner)
  }
}

const uploadToSpecStore = async (config, datafile, resources) => {
  spinner.text = 'Uploading to SpecStore...'
  const baseRawStoreUrl = datafile['datapackage.json']['upload_url']
  let resourceMapping = {}
  resources.forEach(resource => {
    resourceMapping[resource.name] = urljoin(baseRawStoreUrl, datafile[resource.name].md5)
  })
  const postQuery = JSON.stringify({
    'meta': {
      'version': 1,
      'owner': config.get('username'),
      'id': '<id>'
    },
    'inputs': [
      {
        'kind': 'datapackage',
        'url': urljoin(baseRawStoreUrl, datafile['datapackage.json']['md5']),
        'parameters': {
          'resource-mapping': resourceMapping
        }
      }
    ]
  })
  axios.defaults.headers.common["Auth-Token"] = config.get('token')
  axios.defaults.headers.common["Content-Type"] = "application/json"
  const response = await axios.post(
    urljoin(config.get('api'), '/source/upload'),
    postQuery
  ).catch(err => {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      logger(`Not able to connect to ${config.get('api')}`, 'error', true, spinner)
    }
    const statusCodes = [400, 500]
    if (err.response && statusCodes.indexOf(err.response.status) > -1) {
      logger(err.response.data.message, 'error', true, spinner)
    }
    logger(err.message, 'error', true, spinner)
  })
  return response.data
}

module.exports.push = push
module.exports.finalize = finalize
module.exports.uploadToSpecStore = uploadToSpecStore
module.exports.getFileData = getFileData
module.exports.getFileInfo = getFileInfo
module.exports.getFileList = getFileList
module.exports.getFilesForRequest = getFilesForRequest
module.exports.uploadFile = uploadFile
