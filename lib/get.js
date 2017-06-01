const axios = require('axios')
const config = require('./config')

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
      throw new Error('Data Package Not Found')
      // process.exit(1)
    } else {
      console.error(err.message)
      process.exit(1)
    }
  })
  return res.data.bitstore_url
}


module.exports.getServerUrl = getServerUrl
module.exports.getBitstoreUrl = getBitstoreUrl
