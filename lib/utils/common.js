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

module.exports.getServerUrl = getServerUrl
module.exports.checkDpIsThere = checkDpIsThere
module.exports.parseIdentifier = parseIdentifier
