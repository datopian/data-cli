const axios = require('axios')
const config = require('./config')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const url = require('url')
const urljoin = require('url-join')

module.exports.get = (pkgid) => {

}

const getServerUrl = (path=config.configDir) => {
  let conf = config.readConfig(path)
  if (conf) {
    return conf.server
  }
  return config.defaultServer
}

const getMetadata = async (publisher, package, sUrl=getServerUrl() ) => {
  let apiUrl = `${sUrl}/api/package/${publisher}/${package}`
  let res = await axios.get(apiUrl).catch( err => {
    if (err.response && err.response.status === '404') {
      console.error('Data Package Not Found')
      process.exit(1)
    } else {
      console.error(err.message)
      process.exit(1)
    }
  })
  return res.data
}

const checkDestIsEmpty = (publisher, package) => {
  let dest = path.join(publisher, package)
  if (!fs.existsSync(dest)){
    return true
  }
  if (fs.readdirSync(dest).length === 0){
    return true
  }
  return false
}

const getFilesToDownload = (bitStoreUrl, descriptor) => {
  let files = [
    {destPath: 'datapackage.json', url: urljoin(bitStoreUrl, 'datapackage.json')},
    {destPath: 'README', url: urljoin(bitStoreUrl, 'README')},
    {destPath: 'README.md', url: urljoin(bitStoreUrl, 'README.md')},
    {destPath: 'README.txt', url: urljoin(bitStoreUrl, 'README.txt')},
  ]
  let resources = descriptor.resources
  resources.forEach( resource => {
    let resourceUrl = `${bitStoreUrl}/${resource.path}`
    if (resource.url) {
      resourceUrl = resource.url
    }

    let destPath = resource.path
    if (resource.url) {
      let filename = url.parse(resource.url).pathname.split('/').pop();
      destPath = path.join('data', filename);
    }

    files.push({destPath: destPath, url: resourceUrl})
  })
  return files
}

const downloadFile = async (bitStoreUrl, dest, publisher, pkg) => {
  let res = await axios.get(bitStoreUrl, {responseType: 'stream'}).catch(err => {
    console.error(err.message)
    process.exit(1)
  })
  let destPath = path.join(publisher,pkg,dest)
  mkdirp.sync(path.dirname(destPath))
  res.data.pipe(fs.createWriteStream(destPath))
}

const parseDataHubIdentifier = (dhpkgid) => {
  let [publisher, pkg, path ] = dhpkgid.split('/')
  return {
    publisher,
    pkg,
    path
  }
}

module.exports.getServerUrl = getServerUrl
module.exports.getMetadata = getMetadata
module.exports.checkDestIsEmpty = checkDestIsEmpty
module.exports.downloadFile = downloadFile
module.exports.parseDataHubIdentifier = parseDataHubIdentifier
module.exports.getFilesToDownload = getFilesToDownload
