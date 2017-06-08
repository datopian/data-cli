const axios = require('axios')
const urljoin = require('url-join')
const {getMetadata} = require('./get.js')
const {customMarked} = require('./utils/marked.js')
const {logger} = require('./utils/log-handler.js')
const utils = require('../lib/utils/common')

const getInfo = async (dhpkgid) => {
  const { publisher, pkg } = utils.parseIdentifier(dhpkgid)

  const metadata = await getMetadata(publisher, pkg)
  const readme = await getReadme(urljoin(metadata.bitstore_url, 'README.md'))

  const firstParagraphReadme = `# ABOUT\n${readme.substring(0, 200)}... *see more below*`

  let resourcesInfo = '\n# RESOURCES\n'

  metadata.descriptor.resources.forEach(resource => {
    resourcesInfo = `${resourcesInfo}* **${resource.name}** [${resource.format}]\n`
  })

  // console.log first 200 chars of readme
  console.log(customMarked(`***\n${firstParagraphReadme}\n***`))

  // console.log resources summary
  console.log(customMarked(`${resourcesInfo}\n***`))

  // console.log full readme
  console.log(customMarked(`# README\n${readme}\n***`))
}

const getReadme = async (url) => {
  let res = await axios.get(url).catch(err => {
    logger(err.message, 'error', true)
  })
  if(!res) {
    return
  } else {
    return res.data
  }
}

module.exports.getReadme = getReadme
module.exports.getInfo = getInfo
