const axios = require('axios');
const fs = require('fs');
const path = require('path')

exports.get = function(publisher, package, resource, dest) {
  // server hardcoded for now. Later will be parsed from config
  let url = `https://bits.datapackaged.com/metadata/${publisher}/${package}/_v/latest/data/${resource}`
  return axios.get(url)
    .then(res => {
      if (!dest) {
        return process.stdout.write(res.data)
      }
      let fpath = path.join(dest, resource)
      // create path if not exists
      if (!fs.existsSync(dest)){
          fs.mkdirSync(dest);
      }
      fs.writeFileSync(fpath, res.data)
    })
    .catch(err => {
      process.stderr.write(err.message+'\n');
    })
}

exports.push = function(config) {
  getToken(config).then(token => {
    return token
  })
}

function getToken(config) {
  return axios.post(
    config.username+'/api/auth/token',
    {
      'username': config.username,
      'secret': config.accessToken
    }
  ).then(response => {
     return response.data.token
  }).catch(error => {
    process.stderr.write(error.response.data.message+'\n')
    process.exit()
  })
}
