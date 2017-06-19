const axios = require('axios')
const fs = require('fs')
const urljoin = require('url-join')
const Datapackage = require('datapackage').Datapackage
const { customMarked, spinner } = require('./utils/tools.js')
const { logger } = require('./utils/log-handler.js')
const utils = require('../lib/utils/common')

const getInfo = async (dhpkgid) => {
  spinner.start()
  const idObj = utils.parseIdentifier(dhpkgid)
  let dpObj, readme
  if (idObj.dataPackageJsonPath.charAt(0) === '/') {
    dpObj = await new Datapackage('datapackage.json')
    readme = await getReadme(dpObj.descriptor)
  } else {
    try {
      dpObj = await new Datapackage(idObj.dataPackageJsonPath)
    } catch(err) {
      console.log(err)
    }

    readme = await getReadme(dpObj.descriptor, urljoin(idObj.path, 'README.md'))
  }
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

  dpObj.descriptor.resources.forEach(resource => {
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

const getReadme = async (descriptor, url) => {
  // first check if readme is in descriptor
  if(descriptor['readme']) {
    return descriptor['readme']
  }
  // if url is not given then try to read from local disk
  if(!url) {
    try {
      return fs.readFileSync('README.md').toString('utf8')
    } catch(err) {
      return void(0)
    }
  }
  // if url is given then make a http call
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
