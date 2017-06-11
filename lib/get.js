const axios = require('axios')
const chalk = require('chalk')
const { elephant } = require('./utils/logo')
const { bar } = require('./utils/tools')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
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

  const metadata = await utils.getMetadata(publisher, pkg)
  const bitStoreUrl = metadata.bitstore_url
  const descriptor = metadata.descriptor
  const filesToDownload = getFilesToDownload(bitStoreUrl, descriptor)
  let len = filesToDownload.length
  bar.total = len
  bar.tick({
    "download": "Getting data package"
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

const checkDestIsEmpty = (publisher, pkg) => {
  let dest = path.join(publisher, pkg)
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
    } else if (err.code === 'ECONNREFUSED') {
      console.log(`Not able to connect to ${server}`)
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


module.exports.checkDestIsEmpty = checkDestIsEmpty
module.exports.downloadFile = downloadFile
module.exports.getFilesToDownload = getFilesToDownload
