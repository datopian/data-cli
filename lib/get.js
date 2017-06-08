const axios = require('axios')
const chalk = require('chalk')
const config = require('./config')
const { elephant } = require('./utils/logo')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const ProgressBar = require('progress')
const url = require('url')
const urljoin = require('url-join')
const utils = require('./utils/common')

module.exports.get = async(pkgid) => {
  console.time(`${chalk.green('Time elapsed')}`)
  const { publisher, pkg } = utils.parseIdentifier(pkgid)
  if (!publisher ||  !pkg ) {
    console.error('Publisher or package name not found. | See data help get')
    process.exit(1)
  }

  const dist = checkDestIsEmpty(publisher, pkg)
  if (!dist) {
    console.error(`${publisher}/${pkg} is not empty!`)
    process.exit(1)
  }

  const metadata = await getMetadata(publisher, pkg)
  const bitStoreUrl = metadata.bitstore_url
  const descriptor = metadata.descriptor
  const filesToDownload = getFilesToDownload(bitStoreUrl, descriptor)
  let len = filesToDownload.length
  const bar = new ProgressBar(':token1 [:bar] :rate/bps :percent :etas', {
    complete: elephant + ' ',
    incomplete: ' ',
    width: 14,
    total: len
  })

  bar.tick({
    "token1": "Getting data package"
  })

  let downloads = []
  filesToDownload.forEach(file => {
    downloads.push(downloadFile(file.url, file.destPath, publisher, pkg, bar))
  })

  Promise.all(downloads).then(() => {
    bar.tick(len - 1, {
      "token1": "Completed downloads"
    })
    console.timeEnd(`${chalk.green('Time elapsed')}`)
  })

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

const downloadFile = async (bitStoreUrl, dest, publisher, pkg, bar) => {
  let res = await axios.get(bitStoreUrl, {responseType: 'stream'}).catch(err => {
    if (err.response && err.response.status === 404) {
      if (dest.includes('README')) {
        return
      }
      console.error('Data Not Found For ${dest}')
      return
    } else {
      console.log('Failed to retrieve ${dest}')
      console.error(err.message)
      return
    }
  })
  if(!res) {
    return
  }
  let destPath = path.join(publisher,pkg,dest)
  mkdirp.sync(path.dirname(destPath))
  res.data.pipe(fs.createWriteStream(destPath))
  bar.tick()
}


module.exports.getServerUrl = getServerUrl
module.exports.getMetadata = getMetadata
module.exports.checkDestIsEmpty = checkDestIsEmpty
module.exports.downloadFile = downloadFile
module.exports.getFilesToDownload = getFilesToDownload
