const { homedir } = require('os')
const { resolve: resolvePath } = require('path')
const EventEmitter = require('events')
const querystring = require('querystring')
const { parse: parseUrl } = require('url')

const chalk = require('chalk')
const fetch = require('node-fetch')
const FormData = require('form-data')
const lodash = require('lodash')
const urljoin = require('url-join')
const request = require('request-promise-native')

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
      const formData = new FormData();
      lodash.forEach(creds.upload_query, (v,k) => {
        formData.append(k,v)
      })
      // We need to compute content length for S3 and don't want form-data to re-read entire stream to get length
      // so we explicitly add it
      // See https://github.com/alexindigo/form-data/blob/655b95988ef2ed3399f8796b29b2a8673c1df11c/lib/form_data.js#L82
      formData.append('file', resource.stream, {
        knownLength: creds.length
      });
      const totalLength = formData.getLengthSync()

      // use straight fetch as not interacting with API but with external object store
      const res = await fetch(creds.upload_url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Length': totalLength
        }
      })
      if (res.status != 204) {
        let body = await res.text()
        throw Error(`Error uploading to rawstore for ${resource.descriptor.path} with code ${res.status} reason ${body}`)
      }
      // finally add the path to file in the rawstore - this is use by makeSourceSpec
      creds.rawstore_url = creds.upload_url + '/' + creds.upload_query.key
    })
    await Promise.all(uploads)

    this._debugMsg('Uploads to rawstore: Complete')

    this._debugMsg('Uploading to source spec store')

    // Upload to SpecStore
    const spec = makeSourceSpec(rawstoreUploadCreds, this._owner)

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
        owner: this._owner,
        // even though it does nothing in rawstore we have to set name atm
        // see https://github.com/datahq/bitstore/blob/59b0b5a1482a452d566f6fdc3abb5323acac3a7f/bitstore/controllers.py#L37
        name: 'does-not-matter-what-this-is'
      },
      filedata: fileData
    }

    const token = await this._authz('rawstore')
    this._debugMsg('Calling rawstore authorize with')
    this._debugMsg(body)
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
    if(res.status !== 200) {
      throw `Authz server: ${res.statusText}`
    }
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
    if (this._debug) {
      let msg = msg_
      if (lodash.isObject(msg)) {
        msg = JSON.stringify(msg, null, 2)
      }
      console.log('> [debug] ' + msg)
    }
  }
}

const makeSourceSpec = (rawstoreResponse, owner) => {
  let resourceMapping = {}
  lodash.forEach(rawstoreResponse, (uploadInfo, path) => {
    if (path != 'datapackage.json') {
      resourceMapping[path] = uploadInfo.rawstoreurl
    }
  })
  return {
    'meta': {
      'version': 1,
      'owner': owner
    },
    'inputs': [
      {
        'kind': 'datapackage',
        'url': rawstoreResponse['datapackage.json'].rawstore_url,
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

  const err = new Error(message || `Response error - no information. Status code: ${res.status} - ${res.statusText}`)
  err.status = res.status
  err.userError = userError

  return err
}
