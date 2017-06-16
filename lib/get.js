const axios = require('axios')
const chalk = require('chalk')
const Datapackage = require('datapackage').Datapackage
const { elephant } = require('./utils/logo')
const { bar, spinner } = require('./utils/tools')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const url = require('url')
const urljoin = require('url-join')
const utils = require('./utils/common')
const { logger } = require('./utils/log-handler.js')

module.exports.get = async(pkgid) => {
  let start = new Date()
  const idObj = utils.parseIdentifier(pkgid)
  let dpObj
  try {
    dpObj = await new Datapackage(idObj.dataPackageJsonPath)
  } catch(err) {
    logger(err.message, 'error', true, spinner)
  }

  const dist = checkDestIsEmpty(idObj.owner, idObj.name)
  if (!dist) {
    logger(`${idObj.owner}/${idObj.name} is not empty!`, 'error', true, spinner)
  }

  const filesToDownload = getFilesToDownload(idObj.path, dpObj.descriptor)
  let len = filesToDownload.length
  bar.total = len
  bar.tick({
    "download": "Getting data package"
  })

  let downloads = []
  filesToDownload.forEach(file => {
    downloads.push(downloadFile(file.url, file.destPath, idObj.owner, idObj.name, bar))
  })

  Promise.all(downloads).then(() => {
    bar.tick(len - 1, {
      "download": "Completed downloads"
    })
    let end = new Date() - start
    console.log(chalk.green('Time elapsed: ') + (end/1000).toFixed(2) + 's')
  })

}

const checkDestIsEmpty = (owner, name) => {
  let dest = path.join(owner, name)
  if (!fs.existsSync(dest)){
    return true
  }
  if (fs.readdirSync(dest).length === 0){
    return true
  }
  return false
}

const getFilesToDownload = (path_, descriptor) => {
  let files = [
    {destPath: 'datapackage.json', url: urljoin(path_, 'datapackage.json')},
    {destPath: 'README', url: urljoin(path_, 'README')},
    {destPath: 'README.md', url: urljoin(path_, 'README.md')},
    {destPath: 'README.txt', url: urljoin(path_, 'README.txt')},
  ]
  let resources = descriptor.resources
  resources.forEach( resource => {
    let resourceUrl = `${path_}/${resource.path}`
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

const downloadFile = async (path_, dest, owner, name, bar) => {
  let res = await axios.get(path_, {responseType: 'stream'}).catch(err => {
    if (err.response && err.response.status === 404) {
      if (dest.includes('README')) {
        return
      }
      logger(`Data Not Found For ${dest}`, 'error', true, spinner)
    } else if (err.code === 'ECONNREFUSED') {
      logger(`Not able to connect to ${server}`, 'error', true, spinner)
    } else {
      logger('Failed to retrieve ${dest}', 'error')
      logger(err.message, 'error', true, spinner)
      return
    }
  })
  if(!res) {
    return
  }
  let destPath = path.join(owner,name,dest)
  mkdirp.sync(path.dirname(destPath))
  res.data.pipe(fs.createWriteStream(destPath))
  bar.tick()
}


module.exports.checkDestIsEmpty = checkDestIsEmpty
module.exports.downloadFile = downloadFile
module.exports.getFilesToDownload = getFilesToDownload
