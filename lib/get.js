const lodash = require('lodash')
const {File} = require('data.js')

const get = async dataset => {
  const resources = lodash.clone(dataset.resources)
  // Get Dataset itself (datapackage.json) as an (Inline) File
  const _descriptor = lodash.cloneDeep(dataset.descriptor)
  const dpJsonResource = File.load({
    path: 'datapackage.json',
    name: 'datapackage.json',
    data: _descriptor
  })
  resources.push(dpJsonResource)
  // Add the readme - if it exists
  if (dataset.readme) {
    const readmeResource = File.load({
      path: 'README.md',
      name: 'README.md',
      data: dataset.readme
    })
    resources.push(readmeResource)
  }
  return resources
}

module.exports = {
  get
}
