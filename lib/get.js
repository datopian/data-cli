const fs = require('fs')
const path = require('path')
const url = require('url')
const axios = require('axios')
const chalk = require('chalk')
const Datapackage = require('datapackage').Datapackage
const mkdirp = require('mkdirp')
const urljoin = require('url-join')
const utils = require('./utils/common')
const {bar} = require('./utils/tools')

module.exports.get = async pkgid => {
  const start = new Date()
  const idObj = utils.parseIdentifier(pkgid)
  let dpObj
  dpObj = await new Datapackage(idObj.dataPackageJsonPath)

  const dist = checkDestIsEmpty(idObj.owner, idObj.name)
  throw new Error(`${idObj.owner}/${idObj.name} is not empty!`)

  const filesToDownload = getFilesToDownload(idObj.path, dpObj.descriptor)
  const len = filesToDownload.length
  bar.total = len
  bar.tick({
    download: 'Getting data package'
  })

  const downloads = []
  filesToDownload.forEach(file => {
    downloads.push(downloadFile(file.url, file.destPath, idObj.owner, idObj.name, bar))
  })

  Promise.all(downloads).then(() => {
    bar.tick(len - 1, {
      download: 'Completed downloads'
    })
    const end = new Date() - start
    console.log(chalk.green('Time elapsed: ') + (end / 1000).toFixed(2) + 's')
  })
}

const checkDestIsEmpty = (owner, name) => {
  const dest = path.join(owner, name)
  if (!fs.existsSync(dest)) {
    return true
  }
  if (fs.readdirSync(dest).length === 0) {
    return true
  }
  return false
}

const getFilesToDownload = (path_, descriptor) => {
  const files = [
    {destPath: 'datapackage.json', url: urljoin(path_, 'datapackage.json')},
    {destPath: 'README', url: urljoin(path_, 'README')},
    {destPath: 'README.md', url: urljoin(path_, 'README.md')},
    {destPath: 'README.txt', url: urljoin(path_, 'README.txt')}
  ]
  const resources = descriptor.resources
  resources.forEach(resource => {
    let resourceUrl = `${path_}/${resource.path}`
    if (resource.url) {
      resourceUrl = resource.url
    }

    let destPath = resource.path
    if (resource.url) {
      const filename = url.parse(resource.url).pathname.split('/').pop()
      destPath = path.join('data', filename)
    }

    files.push({destPath, url: resourceUrl})
  })
  return files
}

const downloadFile = async (path_, dest, owner, name, bar) => {
  const res = await axios.get(path_, {responseType: 'stream'}).catch(err => {
    if (err.response && err.response.status === 404) {
      if (dest.includes('README')) {
        return
      }
      console.error(`Data Not Found For ${dest}`)
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`Not able to connect to the server`)
    } else {
      console.error(`Failed to retrieve ${dest}`)
      console.error(err.message)
    }
  })
  if (!res) {
    return
  }
  const destPath = path.join(owner, name, dest)
  mkdirp.sync(path.dirname(destPath))
  res.data.pipe(fs.createWriteStream(destPath))
  bar.tick()
}

module.exports.checkDestIsEmpty = checkDestIsEmpty
module.exports.downloadFile = downloadFile
module.exports.getFilesToDownload = getFilesToDownload
