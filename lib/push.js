const axios = require('axios')
const fs = require('fs')
const md5File = require('md5-file');
const path = require('path')
const urljoin = require('url-join')

module.exports.push = async() => {
  const token = await getToken(config)
  console.log(token)
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
      if ((err.response && err.response.status === 404) || (err.response && err.response.status === 403)) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data.token
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
module.exports.getFileInfo = getFileInfo
module.exports.getToken = getToken
