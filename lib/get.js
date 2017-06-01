const axios = require('axios')
const config = require('./config')
const fs = require('fs')
const path = require('path')

module.exports.get = () => {

}

let getServerUrl = (path=config.configDir) => {
    let conf = config.readConfig(path)
  if (conf) {
    return conf.server
  }
  return config.defaultServer
}

let getBitstoreUrl = async (publisher, package, sUrl=getServerUrl ) => {
  let apiUrl = `${sUrl}/api/package/${publisher}/${package}`
  let res = await axios.get(apiUrl).catch( err => {
    if (err.status === '404') {
      console.error('Data Package Not Found')
      process.exit(1)
    } else {
      console.error(err.message)
      process.exit(1)
    }
  })
  return res.data.bitstore_url
}

let checkDestIsEmpty = (publisher, package) => {
  let dest = path.join(publisher, package)
  if (!fs.existsSync(dest)){
    return true
  }
  if (fs.readdirSync(dest).length === 0){
    return true
  }
  return false
}

module.exports.getServerUrl = getServerUrl
module.exports.getBitstoreUrl = getBitstoreUrl
module.exports.checkDestIsEmpty = checkDestIsEmpty
