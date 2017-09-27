const fs = require('fs')
const {join, parse} = require('path')

const normalizeSchema = dp => {
  for (const propertyName in dp) {
    if (dp[propertyName].constructor === Object) {
      dp[propertyName] = [dp[propertyName]]
    }
  }
  return dp
}

const nomralizeDateFormat = dp => {
  for (const idx in dp.resources) {
    const resource = dp.resources[idx]
    if (resource.schema) {
      for (const id in resource.schema.fields) {
        const field = resource.schema.fields[id]
        if (field.type === 'date') {
          field.format = 'any'
        }
      }
    }
  }
  return dp
}

const normalizeType = dp => {
  for (const idx in dp.resources) {
    const resource = dp.resources[idx]
    if (resource.schema) {
      for (const id in resource.schema.fields) {
        const field = resource.schema.fields[id]
        const unsupportedNumberTypes = ['decimal', 'double', 'float']
        if (unsupportedNumberTypes.indexOf(field.type) > -1) {
          field.type = 'number'
        }
      }
    }
  }
  return dp
}

const normalizeNames = dp => {
  for (const idx in dp.resources) {
    if (dp.resources[idx].name) {
      dp.resources[idx].name = dp.resources[idx].name.toLowerCase().replace(' ', '-')
    } else {
      const pathParts = parse(dp.resources[idx].path)
      dp.resources[idx].name = pathParts.name
    }
  }
  dp.name = dp.name.toLowerCase().replace(' ', '-')
  return dp
}

const normalizeLicenseName = dp => {
  for (const idx in dp.licenses) {
    if (dp.licenses[idx].name) {
      dp.licenses[idx].name = dp.licenses[idx].name.toLowerCase().replace(/\s/g, '_')
    }
  }
  return dp
}

const normalizeSources = dp => {
  for (const idx in dp.sources) {
    dp.sources[idx].title = dp.sources[idx].name
  }
  for (const idx in dp.resources) {
    for (const id in dp.resources[idx].sources) {
      if (dp.resources[idx].sources[id].title) {
        dp.resources[idx].sources[id].title = dp.resources[idx].sources[id].title
      }
      else if (dp.resources[idx].sources[id].name) {
        dp.resources[idx].sources[id].title = dp.resources[idx].sources[id].name
      }
      else {
        dp.resources[idx].sources[id].title = 'unknown'
      }
    }
  }
  return dp
}

const normalizeContributors = dp => {
  const normalizeContributorsTitle = dp => {
    for (const idx in dp.contributors) {
      if (!dp.contributors[idx].title) {
        dp.contributors[idx].title = dp.contributors[idx].name ? dp.contributors[idx].name: ''
      }
    }
  }
  if (dp.author) {
    if (dp.contributors) {
      dp.contributors.push({title: dp.author})
      delete dp.author
      normalizeContributorsTitle(dp)
    } else {
      dp.contributors = new Array();
      dp.contributors.push({title: dp.author})
      delete dp.author
      normalizeContributorsTitle(dp)
    }
  } else {
    normalizeContributorsTitle(dp)
  }
  return dp
}

const normalizePath = dp => {
  for (const idx in dp.resources) {
    if (dp.resources[idx].path) {
      if (dp.resources[idx].url) {
        delete dp.resources[idx].url
      }
    }
    else if (dp.resources[idx].url) {
      dp.resources[idx].path = dp.resources[idx].url
      delete dp.resources[idx].url
    }
  }
  return dp
}

const normalizeAll = dp => {
  dp = normalizePath(dp)
  dp = normalizeSchema(dp)
  dp = nomralizeDateFormat(dp)
  dp = normalizeType(dp)
  dp = normalizeNames(dp)
  dp = normalizeLicenseName(dp)
  dp = normalizeSources(dp)
  dp = normalizeContributors(dp)
  return dp
}

const normalize = path => {
  const writeDatapackage = dp => {
    fs.writeFile(path, JSON.stringify(dp, null, 2), err => {
      if (err) {
        console.error(err.message)
        return
      }
      console.log('Datapackage.json has been normalized')
    })
  }

  const readDatapackage = path => {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  }

  if (!path) {
    path = 'datapackage.json'
    const dp = readDatapackage(path)
    normalizeAll(dp)
    writeDatapackage(dp)
  } else {
    if (fs.lstatSync(path).isFile()) {
      const dp = readDatapackage(path)
      normalizeAll(dp)
      writeDatapackage(dp)
    } else {
      path = join(path, 'datapackage.json')
      const dp = readDatapackage(path)
      normalizeAll(dp)
      writeDatapackage(dp)
    }
  }
}

module.exports.normalize = normalize
module.exports.normalizeAll = normalizeAll
module.exports.nomralizeDateFormat = nomralizeDateFormat
module.exports.normalizeNames = normalizeNames
module.exports.normalizeSchema = normalizeSchema
module.exports.normalizeLicenseName = normalizeLicenseName
module.exports.normalizeSources = normalizeSources
module.exports.normalizeType = normalizeType
