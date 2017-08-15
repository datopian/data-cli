const {dumpers} = require('./cat')

const infoPackage = dataset => {
  let firstParagraphReadme
  const readme = dataset.readme || 'No readme is provided'

  if (readme) {
    firstParagraphReadme = readme.substring(0, 200).split(' ')
    firstParagraphReadme.pop()
    firstParagraphReadme = firstParagraphReadme.join(' ')
  }

  let resourcesInfo = `
  \n# RESOURCES\n
  | Name | Format |
  |------|--------|
  `

  dataset.descriptor.resources.forEach(resource => {
    resourcesInfo += `|${resource.name}|${resource.format || 'N/A'}|\n`
  })

  const out = `

${firstParagraphReadme} ... *see more below*

${resourcesInfo}

# README

${readme}
`
  return out
}

const infoResource = async resource => {
  const out = await dumpers.ascii(resource)
  return out
}

module.exports = {
  infoPackage,
  infoResource
}
