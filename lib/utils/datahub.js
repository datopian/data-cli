const { homedir } = require('os')
const { resolve: resolvePath } = require('path')
const EventEmitter = require('events')
const querystring = require('querystring')
const { parse: parseUrl } = require('url')

const chalk = require('chalk')
const fetch = require('node-fetch')
const lodash = require('lodash')
const urljoin = require('url-join')

const { Agent } = require('./agent')
const { Resource } = require('./data')


export class DataHub extends EventEmitter {
  constructor({ apiUrl, token, debug = false }) {
    super()
    this.apiUrl = apiUrl
    this._token = token
    this._debug = debug
    this._agent = new Agent(apiUrl, { debug })
  }

  async push(pkg) {
    // TODO: exclude remote Resources
    let resources = lodash.clone(pkg.resources)
    var dpJsonResource = Resource.load('datapackage.json', {basePath: pkg.path})
    resources.push(dpJsonResource)

    var rawstoreUploadCreds = await this.rawstoreAuthorize(resources)

    // upload - we do them in parallel
    let uploads = resources.map(resource => {
      // TODO: annoying that the serves parses the s3 url so we have to unparse it!
      const creds = rawstoreUploadCreds[resource.descriptor.path]
      const url = creds.upload_url + '?' + querystring.stringify(creds.upload_query)
      return fetch(url, {
        method: 'POST', body: resource.stream
      })
    })
    await Promise.all(uploads)
  }

  async rawstoreAuthorize(resources) {
    // TODO: README
    // TODO: merge the readme into the descriptor

    let fileData = {}
    resources.forEach(resource => {
      fileData[resource.descriptor.path] = { 
        length: resource.size,
        md5: resource.hash,
        // not needed - optional in bitstore API
        // type: 'binary/octet-stream',
        name: resource.descriptor.name
      }
    })

    let body = {
      metadata: {
        owner: null,
        name: null
      },
      filedata: fileData
    }

    try {
      const res = await this._fetch('/rawstore/authorize', {
        method: 'POST',
        body: body
      })
          
      if (res.status == 200) {
        const out = await res.json()
        return out.filedata
      } else { // TODO: fix this up.
        const statusCodes = [400, 500]
        if (res.response && statusCodes.indexOf(res.status) > -1) {
          throw new Error(res.message)
        }
        throw new Error(res.message)
      }
    } catch (err) {
      throw new Error('Unexpected response ' + err.message)
    }
  }

  specstore(rawstoreResponse) {
  }

  close() {
    this._agent.close()
  }

  _fetch(_url, opts = {}) {
    opts.headers = opts.headers || {}
    opts.headers['Auth-Token'] = this._token
    return this._agent.fetch(_url, opts)
  }
}

const uploadToSpecStore = async (config, datafile, resources) => {
  spinner.text = 'Uploading to SpecStore...'
  const baseRawStoreUrl = datafile['datapackage.json']['upload_url']
  let resourceMapping = {}
  resources.forEach(resource => {
    resourceMapping[resource.name] = urljoin(baseRawStoreUrl, datafile[resource.name].md5)
  })
  const postQuery = JSON.stringify({
    'meta': {
      'version': 1,
      'owner': config.get('username'),
      'id': '<id>'
    },
    'inputs': [
      {
        'kind': 'datapackage',
        'url': urljoin(baseRawStoreUrl, datafile['datapackage.json']['md5']),
        'parameters': {
          'resource-mapping': resourceMapping
        }
      }
    ]
  })
  axios.defaults.headers.common["Auth-Token"] = config.get('token')
  axios.defaults.headers.common["Content-Type"] = "application/json"
  const response = await axios.post(
    urljoin(config.get('api'), '/source/upload'),
    postQuery
  ).catch(err => {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      logger(`Not able to connect to ${config.get('api')}`, 'error', true, spinner)
    }
    const statusCodes = [400, 500]
    if (err.response && statusCodes.indexOf(err.response.status) > -1) {
      logger(err.response.data.message, 'error', true, spinner)
    }
    logger(err.message, 'error', true, spinner)
  })
  return response.data
}

