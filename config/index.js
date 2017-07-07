'use strict'

const path = require('path')
const nconf = require('nconf')

nconf.argv()
  .env()
  .file({
    file: path.join(__dirname, '~/.datahub.json')
  })

// This is the object that you want to override in your own local config
nconf.defaults({
  api: 'http://api.testing.datapackaged.com',
  domain: 'http://testing.datapackaged.com',
  token: '',
  email: '',
  username: ''
})

module.exports = {
  get: nconf.get.bind(nconf),
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf)
}
