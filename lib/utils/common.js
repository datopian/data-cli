const axios = require('axios')
const config = require('../config')

const parseIdentifier = (dhpkgid) => {
  const [publisher, pkg, path ] = dhpkgid.split('/')
  return {
    publisher,
    pkg,
    path
  }
}

const getServerUrl = (path=config.configDir) => {
  const conf = config.readConfig(path)
  if (conf) {
    return conf.server
  }
  return config.defaultServer
}

const checkDpIsThere = () => {
  const files = fs.readdirSync(process.cwd())
  return files.indexOf('datapackage.json') > -1
}

const getMetadata = async (publisher, package, sUrl=getServerUrl() ) => {
  let apiUrl = `${sUrl}/api/package/${publisher}/${package}`
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

module.exports.getServerUrl = getServerUrl
module.exports.checkDpIsThere = checkDpIsThere
module.exports.parseIdentifier = parseIdentifier
module.exports.getMetadata = getMetadata
