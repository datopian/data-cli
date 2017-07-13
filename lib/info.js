const axios = require('axios')
const fs = require('fs')
const urljoin = require('url-join')
const Datapackage = require('datapackage').Datapackage
const { customMarked } = require('./utils/tools.js')
const { logger } = require('./utils/log-handler.js')
const utils = require('../lib/utils/identifier')

export const info = (pkg) => {
  let firstParagraphReadme
  const readme = pkg.readme || 'No readme is provided'

  if(readme) {
    firstParagraphReadme = readme.substring(0, 200).split(' ')
    firstParagraphReadme.pop()
    firstParagraphReadme = firstParagraphReadme.join(' ')
  }

  let resourcesInfo = `
  \n# RESOURCES\n
  | Name | Format |
  |------|--------|
  `

  pkg.descriptor.resources.forEach(resource => {
    resourcesInfo += `|${resource.name}|${resource.format||'N/A'}|\n`
  })

  const out = `

${firstParagraphReadme} ... *see more below*

${resourcesInfo}

# README
  
${readme}
`
  return out
}

