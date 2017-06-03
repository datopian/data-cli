const axios = require('axios')
const creds = require('./config')
const fs = require('fs')
const md5File = require('md5-file');
const path = require('path')
const urljoin = require('url-join')

module.exports.push = async() => {
  const config = creds.readConfig()
  if (!checkDpIsThere()) {
    console.error('datapckage.json not found!')
    process.exit(1)
  }
  const dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  const token = await getToken(config)
  const files = getFileList(dpjson)
  const infoForRequest = getFilesForRequest(files, config.username, dpjson.name)
  const fileData = await getFileData(config, infoForRequest, token)
  files.forEach(file => {
    uploadFile(file, fileData[file])
  })
  console.log(fileData)

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

const uploadFile = (filePath, data) => {
  const fileStream = fs.readFileSync(filePath)
  axios.post(data.upload_url,
      data=data.uploa_query, files={file: fileStream}).catch(err =>{
    console.log(err.message)
  })
}

module.exports.checkDpIsThere = checkDpIsThere
module.exports.getFileData = getFileData
module.exports.getFileInfo = getFileInfo
module.exports.getFileList = getFileList
module.exports.getFilesForRequest = getFilesForRequest
module.exports.getToken = getToken
