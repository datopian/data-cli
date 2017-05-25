const axios = require('axios');
const fs = require('fs');
const path = require('path')

exports.get = function(publisher, package, resource, dest) {
  // server hardcoded for now. Later will be parsed from config
  let url = `https://bits.datapackaged.com/metadata/${publisher}/${package}/_v/latest/data/${resource}`
  return axios.get(url)
    .then(res => {
      if (!dest.length) {
        return process.stdout.write(res.data)
      }
      let dir = dest[0]
      let fpath = path.join(dest[0], resource)
      // create path if not exists
      if (!fs.existsSync(dir)){
          fs.mkdirSync(dir);
      }
      fs.writeFileSync(fpath, res.data)
    })
    .catch(err => {
      process.stderr.write(err.message+'\n');
    })
}
