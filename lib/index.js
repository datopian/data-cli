const axios = require('axios')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const readline = require('readline')
const url = require('url')

const get = (publisher, package, resource, dest) => {
  // server hardcoded for now. Later will be parsed from config
  let metaUrl = `https://staging.datapackaged.com/api/package/${publisher}/${package}`

  if (dest && !fs.existsSync(dest)){
    mkdirp.sync(dest);
  }

  axios.get(metaUrl).then(res =>{

    let bitStoreUrl = res.data.bitstore_url
    let resources = res.data.descriptor.resources

    if (resource) {
      resources = resources.filter(res => {
        let pathName = res.path
        if (res.url) {
          pathName = res.url
        }
        return res.name == resource || pathName.includes(resource)
      })
    }
    if (!resources.length) {
      process.stderr.write('Resource Not Found\n')
      process.exit()
    }

    resources.forEach(resource => {
      let resourceUrl = `${bitStoreUrl}/${resource.path}`
      if (resource.url) {
        resourceUrl = resource.url
      }
      axios.get(resourceUrl, { responseType: 'stream'})
        .then(function(res) {
          if (!dest) {
            res.data.on('data', (chunk) => {
              // log first chunk of stream and exit
              process.stdout.write(chunk.toString('utf8') + '\n')
              process.exit()
            })
            return
          }
          let destPath = ''
          if (resource.path) {
            destPath = path.join(dest, resource.path);
          } else {
            let filename = url.parse(resource.url).pathname.split('/').pop();
            destPath = path.join(dest, 'data', filename);
          }
          mkdirp.sync(path.dirname(destPath));
          res.data.pipe(fs.createWriteStream(destPath))
        }).catch(err => {
          process.stderr.write(err.message + '\n')
        })
    })
  }).catch(err => {
    process.stderr.write(err.message + '\n')
  })
}

const push = (config) => {
  getToken(config).then(token => {
    return token
  })
}

let getToken = async (config) => {
  let resp = await axios.post(
    config.server+'/api/auth/token',
    {
      'username': config.username,
      'secret': config.accessToken
    }
  ).catch(error => {
    process.stderr.write(error.response.data.message+'\n')
    process.exit()
  })
  return resp.data.token
}

module.exports.get = get
module.exports.push = push
