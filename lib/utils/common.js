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

module.exports.getServerUrl = getServerUrl
module.exports.parseIdentifier = parseIdentifier
