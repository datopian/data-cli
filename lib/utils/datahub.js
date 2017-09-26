const EventEmitter = require('events')
const fetch = require('node-fetch')
const FormData = require('form-data')
const lodash = require('lodash')
const {File, xlsxParser} = require('data.js')
const XLSX = require('xlsx')
const toArray = require('stream-to-array')
const infer = require('tableschema').infer
const Git = require('nodegit')
const tmp = require('tmp')
const YAML = require('yamljs')

const {Agent} = require('./agent')

// TODO
// debug logging - and use to output what we are sending to APIs
// get user id from /auth/check when we login and store it and use it
// get dedicated auth token for the rawstore
// common error handling for fetch stuff ... (?)

class DataHub extends EventEmitter {
  constructor({apiUrl, token, ownerid, owner, debug = false}) {
    super()
    this.apiUrl = apiUrl
    this._token = token
    this._debug = debug
    this._ownerid = ownerid
    this._owner = owner
    this._agent = new Agent(apiUrl, {debug})
  }

  async push(dataset, options) {
    // TODO: exclude remote Resources
    const resources = lodash.clone(dataset.resources)
    // Get Dataset itself (datapackage.json) as an (Inline) File
    const _descriptor = lodash.cloneDeep(dataset.descriptor)
    // Add the readme - if it exists
    if (dataset.readme) {
      _descriptor.readme = dataset.readme
    }
    const dpJsonResource = File.load({
      path: 'datapackage.json',
      name: 'datapackage.json',
      data: _descriptor
    })
    resources.push(dpJsonResource)

    this._debugMsg('Getting rawstore upload creds')

    const rawstoreUploadCreds = await this.rawstoreAuthorize(resources)

    this._debugMsg('Uploading to rawstore with creds ...')
    this._debugMsg(rawstoreUploadCreds)

    // Upload - we do them in parallel
    const uploads = resources.map(async resource => {
      // TODO: annoying that the serves parses the s3 url so we have to unparse it!
      const creds = rawstoreUploadCreds[resource.descriptor.name]
      const formData = new FormData()
      lodash.forEach(creds.upload_query, (v, k) => {
        formData.append(k, v)
      })
      // We need to compute content length for S3 and don't want form-data to re-read entire stream to get length
      // so we explicitly add it
      // See https://github.com/alexindigo/form-data/blob/655b95988ef2ed3399f8796b29b2a8673c1df11c/lib/form_data.js#L82
      formData.append('file', resource.stream(), {
        knownLength: resource.size,
        contentType: creds.upload_query['Content-Type']
      })
      const totalLength = formData.getLengthSync()

      // Use straight fetch as not interacting with API but with external object store
      const res = await fetch(creds.upload_url, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Length': totalLength
        }
      })
      if (res.status !== 204) {
        const body = await res.text()
        throw new Error(`Error uploading to rawstore for ${resource.descriptor.path} with code ${res.status} reason ${body}`)
      }
      // Finally add the path to file in the rawstore - this is use by makeSourceSpec
      // TODO: should we use urljoin?
      // eslint-disable-next-line camelcase
      creds.rawstore_url = creds.upload_url + '/' + creds.upload_query.key
    })
    await Promise.all(uploads)

    this._debugMsg('Uploads to rawstore: Complete')

    this._debugMsg('Uploading to source spec store')

    // Upload to SpecStore
    const spec = await makeSourceSpec(rawstoreUploadCreds, this._ownerid, this._owner, dataset, options)

    this._debugMsg('Calling source upload with spec')
    this._debugMsg(spec)


    const token = await this._authz('source')
    const res = await this._fetch('/source/upload', token, {
      method: 'POST',
      body: spec
    })

    if (res.status === 200) {
      const out = await res.json()
      this._debugMsg(out)
      return out
    }
    throw new Error(responseError(res))
  }

  async pushFlow(url){
    const tmpdir = tmp.dirSync()
    try {
      await Git.Clone(url, tmpdir.name)
    } catch (err) {
      throw new Error(`Failed to clone from ${url}`)
    }
    let spec = {}
    try {
      spec = YAML.load(`${tmpdir.name}/.datahub/flow.yaml`)
    } catch (err) {
      throw new Error(`.datahub/flow.yaml Does not exist`)
    }

    this._debugMsg('Calling source upload with spec')
    this._debugMsg(spec)

    const token = await this._authz('source')
    this._debugMsg(token)
    const res = await this._fetch('/source/upload', token, {
      method: 'POST',
      body: spec
    })

    if (res.status === 200) {
      const out = await res.json()
      this._debugMsg(out)
      return out
    }
    throw new Error(responseError(res))
  }

  async rawstoreAuthorize(resources) {
    // TODO: README
    // TODO: merge the readme into the descriptor

    const fileData = {}
    resources.forEach(resource => {
      fileData[resource.descriptor.name] = {
        length: resource.size,
        md5: resource.hash,
        // Not needed - optional in bitstore API
        // type: 'binary/octet-stream',
        name: resource.descriptor.name
      }
    })

    const body = {
      metadata: {
        owner: this._ownerid
      },
      filedata: fileData
    }

    const token = await this._authz('rawstore')
    this._debugMsg('Calling rawstore authorize with')
    this._debugMsg(body)
    const res = await this._fetch('/rawstore/authorize', token, {
      method: 'POST',
      body
    })

    if (res.status === 200) {
      const out = await res.json()
      return out.filedata
    }
    throw new Error(await responseError(res))
  }

  async _authz(service) {
    this._debugMsg(`Getting authz token for ${service} service`)
    const res = await this._fetch(
      `/auth/authorize?service=${service}`,
      this._token
    )
    if (res.status !== 200) {
      throw new Error(`Authz server: ${res.statusText}`)
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

const makeSourceSpec = async (rawstoreResponse, ownerid, owner, dataset, options) => {
  const resourceMapping = {}
  lodash.forEach(rawstoreResponse, (uploadInfo, resourceName) => {
    if (resourceName !== 'datapackage.json') {
      resourceMapping[resourceName] = uploadInfo.rawstore_url
    }
  })
  let processing = await processExcelSheets(dataset.resources)
  processing = processing[0] ? processing : undefined
  return {
    meta: {
      version: 1,
      ownerid,
      owner,
      dataset: dataset.descriptor.name,
      findability: options.findability
    },
    inputs: [
      {
        kind: 'datapackage',
        // Above we set the "name" for the data package resource to be
        // datapackage.json so we use that name to look it up in rawstoreResponse
        url: rawstoreResponse['datapackage.json'].rawstore_url,
        parameters: {
          'resource-mapping': resourceMapping
        }
      }
    ],
    processing
  }
}

async function processExcelSheets(resources = []) {
  const excelFormats = ['xls', 'xlsx']
  const processingSteps = []
  const steps = resources.map(async res => {
    if (excelFormats.includes(res.descriptor.format)) {
      const buffer = await res.buffer
      const workbook = XLSX.read(buffer, {type: 'buffer', bookSheets: true})
      if (workbook.SheetNames.length > 1) {
        for (let i = 1; i < workbook.SheetNames.length; i++) {
          const rows = await toArray(await xlsxParser(res, false, i))
          const schema = await infer(rows)
          const step = {
            input: res.descriptor.name,
            output: `${res.descriptor.name}-sheet-${i+1}`,
            tabulator: {
              headers: schema.fields.length,
              sheet: i + 1
            },
            schema
          }
          processingSteps.push(step)
        }
      }
    }
  })
  await Promise.all(steps)
  return processingSteps
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

module.exports = {
  DataHub,
  processExcelSheets
}
