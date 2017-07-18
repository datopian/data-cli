const {dumpers} = require('./cat')

export const infoPackage = pkg => {
  let firstParagraphReadme
  const readme = pkg.readme || 'No readme is provided'

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

  pkg.descriptor.resources.forEach(resource => {
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

export const infoResource = async resource => {
  const out = await dumpers.ascii(resource)
  return out
}
