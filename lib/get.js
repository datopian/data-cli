const config = require('./config')

let getServerUrl = (path=config.configDir) => {
  let conf = config.readConfig(path)
  if (conf) {
    return conf.server
  }
  return config.defaultServer
}

module.exports.getServerUrl = getServerUrl
