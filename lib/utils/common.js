const fs = require('fs')

const urljoin = require('url-join')
const axios = require('axios')


const checkDpIsThere = (path_ = process.cwd()) => {
  const files = fs.readdirSync(path_)
  return files.indexOf('datapackage.json') > -1
}

module.exports.checkDpIsThere = checkDpIsThere

