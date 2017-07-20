const {homedir} = require('os')
const path = require('path')
const fs = require('fs')

const nconf = require('nconf')

let file = process.env.DATAHUB_JSON
  ? path.resolve(process.env.DATAHUB_JSON)
  : path.resolve(homedir(), '.datahub.json')

nconf.argv()
  .env()
  .file({
    file
  })

// This is the object that you want to override in your own local config
nconf.defaults({
  api: 'https://api.datahub.io',
  domain: 'https://datahub.io',
  token: '',
  email: '',
  username: ''
})

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

/**
 * Reads the config file
 *
 * @return {Object}
 */
function read() {
  let existing = {}
  try {
    existing = fs.readFileSync(file, 'utf8')
    existing = JSON.parse(existing)
  } catch (err) {}

  return existing
}

/**
 * Merges the `data` object onto the
 * JSON config stored in `.datahub.json`.
 *
 * (atomic)
 * @param {Object} data
 */
function merge(data) {
  const cfg = Object.assign({}, read(), data)
  save(cfg)
}

module.exports = {
  get: nconf.get.bind(nconf),
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf),
  merge
}
