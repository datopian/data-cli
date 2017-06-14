const axios = require('axios')
const urljoin = require('url-join')
const { customMarked, spinner } = require('./utils/tools.js')
const { logger } = require('./utils/log-handler.js')
const utils = require('../lib/utils/common')

const getInfo = async (dhpkgid) => {
  spinner.start()
  const { publisher, name } = utils.parseIdentifier(dhpkgid, 'datahub')
  const metadata = await utils.getMetadata(publisher, name)
  let readme = await getReadme(urljoin(metadata.bitstore_url, 'README.md'))
  let firstParagraphReadme

  if(readme) {
    firstParagraphReadme = readme.substring(0, 200).split(' ')
    firstParagraphReadme.pop()
    firstParagraphReadme = `# ABOUT\n${firstParagraphReadme.join(' ')}... *see more below*`
  } else {
    readme = 'No readme is provided.'
    firstParagraphReadme = readme
  }

  let resourcesInfo = `
  \n# RESOURCES\n
  | Name | Format |
  |------|--------|
  `

  metadata.descriptor.resources.forEach(resource => {
    resourcesInfo += `|${resource.name}|${resource.format||'N/A'}|\n`
  })

  spinner.stop()

  // console.log first 200 chars of readme
  console.log('\n'+ customMarked(`***\n${firstParagraphReadme}\n***`))

  // console.log resources summary
  console.log(customMarked(`${resourcesInfo}\n***`))

  // console.log full readme
  console.log(customMarked(`# README\n${readme}\n***`))
}

const getReadme = async (url) => {
  let res = await axios.get(url).catch(err => {
    return void(0)
  })
  if(!res) {
    return void(0)
  }
  return res.data
}

module.exports.getReadme = getReadme
module.exports.getInfo = getInfo
