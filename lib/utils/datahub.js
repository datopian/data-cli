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

// TODO
// debug logging - and use to output what we are sending to APIs
// get user id from /auth/check when we login and store it and use it
// get dedicated auth token for the rawstore
// common error handling for fetch stuff ... (?)

export class DataHub extends EventEmitter {
  constructor({ apiUrl, token, owner, debug = false }) {
    super()
    this.apiUrl = apiUrl
    this._token = token
    this._debug = debug
    this._owner = owner
    this._agent = new Agent(apiUrl, { debug })
  }

  async push(pkg) {
    // TODO: exclude remote Resources
    let resources = lodash.clone(pkg.resources)
    var dpJsonResource = Resource.load('datapackage.json', {basePath: pkg.path})
    resources.push(dpJsonResource)

    this._debugMsg('Getting rawstore upload creds')

    var rawstoreUploadCreds = await this.rawstoreAuthorize(resources)

    this._debugMsg('Uploading to rawstore with creds ...')
    this._debugMsg(rawstoreUploadCreds)

    // upload - we do them in parallel
    let uploads = resources.map(async resource => {
      // TODO: annoying that the serves parses the s3 url so we have to unparse it!
      const creds = rawstoreUploadCreds[resource.descriptor.path]
      const url = creds.upload_url + '?' + querystring.stringify(creds.upload_query)
      // use straight fetch as not interacting with API but with external object store
      return await fetch(url, {
        method: 'POST',
        body: resource.stream
      })
    })
    await Promise.all(uploads)

    this._debugMsg('Uploads to rawstore: Complete')

    this._debugMsg('Uploading to source spec store')

    // Upload to SpecStore
    const spec = makeSourceSpec(rawstoreUploadCreds)

    this._debugMsg('Calling source upload with spec')
    this._debugMsg(spec)

    const token = await this._authz('source')
    const res = await this._fetch('/source/upload', token, {
      method: 'POST',
      body: spec
    })

    if (res.status === 200) {
      const out = res.json()
    } else {
      throw Error(responseError(res))
    }
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

    const token = await this._authz('rawstore')
    this._debugMsg('Calling rawstore authorize')
    const res = await this._fetch('/rawstore/authorize', token, {
      method: 'POST',
      body: body
    })

    if (res.status == 200) {
      const out = await res.json()
      return out.filedata
    } else {
      throw new Error(await responseError(res))
    }
  }

  async _authz(service) {
    this._debugMsg(`Getting authz token for ${service} service`)
    const res = await this._fetch(
      `/auth/authorize?service=${service}`,
      this._token
    )
    return (await res.json()).token
  }

  close() {
    this._agent.close()
  }

  _fetch(_url, token, opts = {}) {
    opts.headers = opts.headers || {}
    opts.headers['Auth-Token'] = token
    return this._agent.fetch(_url, opts)
  }

  _debugMsg(msg_) {
    let msg = msg_
    if (lodash.isObject(msg)) {
      msg = JSON.stringify(msg, null, 2)
    }
    console.log('> [debug] ' + msg)
  }
}

const makeSourceSpec = (rawstoreResponse, owner) => {
  let resourceMapping = {}
  lodash.forEach(rawstoreResponse, (uploadInfo, path) => {
    resourceMapping[path] = uploadInfo.upload_url
  })
  return {
    'meta': {
      'version': 1,
      'owner': owner
    },
    'inputs': [
      {
        'kind': 'datapackage',
        'url': rawstoreResponse['datapackage.json'].upload_url,
        'parameters': {
          'resource-mapping': resourceMapping
        }
      }
    ]
  }
}

async function responseError(res) {
  let message
  let userError

  if (res.status >= 400 && res.status < 500) {
    let body

    try {
      body = await res.json()
    } catch (err) {
      body = {}
    }

    message = (body.error || {}).message
    userError = true
  } else {
    message = await res.text()
    userError = false
  }

  const err = new Error(message || 'Response error')
  err.status = res.status
  err.userError = userError

  return err
}
