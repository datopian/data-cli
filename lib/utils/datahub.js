const EventEmitter = require('events')
const fetch = require('node-fetch')
const FormData = require('form-data')
const lodash = require('lodash')
const {File, xlsxParser} = require('data.js')
const XLSX = require('xlsx')
const toArray = require('stream-to-array')
const infer = require('tableschema').infer
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
    let resources = lodash.clone(dataset.resources)
    // Exclude remote Resources
    resources = resources.filter(res => res.descriptor.pathType === 'local')
    // Get Dataset itself (datapackage.json) as an (Inline) File
    const _descriptor = lodash.cloneDeep(dataset.descriptor)
    const dpJsonResource = File.load({
      path: 'datapackage.json',
      name: 'datapackage.json',
      data: _descriptor
    })
    resources.push(dpJsonResource)

    this._debugMsg('Getting rawstore upload creds')

    const rawstoreUploadCreds = await this.rawstoreAuthorize(resources, options)

    this._debugMsg('Uploading to rawstore with creds ...')
    this._debugMsg(rawstoreUploadCreds)

    // Upload - we do them in parallel
    const uploads = resources.map(async resource => {
      // TODO: annoying that the serves parses the s3 url so we have to unparse it!
      const creds = rawstoreUploadCreds[resource.descriptor.path]
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
      if (res.status > 204) {
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
    const spec = await this.makeSourceSpec(rawstoreUploadCreds, dataset, options)

    this._debugMsg('Calling source upload with spec')
    this._debugMsg(spec)


    const token = await this._authz('source')
    const res = await this._fetch('/source/upload', token, {
      method: 'POST',
      body: spec
    })

    if (res.status === 200) {
      const out = await res.json()
      if (out.success) {
        this._debugMsg(out)
        return out
      } else {
        throw new Error(out.errors.join('\n'))
      }
    }
    throw new Error(responseError(res))
  }

  async pushFlow(specPath){
    let spec = {}
    try {
      spec = YAML.load(specPath)
    } catch (err) {
      throw new Error(err.message)
    }

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

  async rawstoreAuthorize(resources, options={}) {
    const fileData = {}
    resources.forEach(resource => {
      fileData[resource.descriptor.path] = {
        length: resource.size,
        md5: resource.hash,
        // Not needed - optional in bitstore API
        // type: 'binary/octet-stream',
        name: resource.descriptor.name
      }
    })

    const body = {
      metadata: {
        owner: this._ownerid,
        findability: options.findability
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


  async makeSourceSpec(rawstoreResponse, dataset, options) {
    const resourceMapping = {}
    const token = await this._authz('rawstore')
    lodash.forEach(rawstoreResponse, async (uploadInfo, resourceName) => {
      if (resourceName !== 'datapackage.json') {
        const res = await this._fetch(
            `/rawstore/presign?ownerid=${this._ownerid}&url=${uploadInfo.rawstore_url}`,
            token, {method: 'GET'}
        )
        if (res.status !== 200) {
          throw new Error(responseError(res))
        }
        const signedurl = await res.json()
        resourceMapping[resourceName] = signedurl.url
      }
    })
    let processing = await processExcelSheets(dataset.resources, options.sheets)
    processing = processing[0] ? processing : undefined
    let outputs = handleOutputs(options.outputs)
    outputs = outputs[0] ? outputs : undefined
    const schedule = options.schedule
    const dpUrl = rawstoreResponse['datapackage.json'].rawstore_url
    const res = await this._fetch(
        `/rawstore/presign?ownerid=${this._ownerid}&url=${dpUrl}`,
        token, {method: 'GET'}
    )
    if (res.status !== 200) {
      throw new Error(responseError(res))
    }
    const dpSignedurl = await res.json()
    return {
      meta: {
        version: 1,
        ownerid: this._ownerid,
        owner: this._owner,
        dataset: dataset.descriptor.name,
        findability: options.findability
      },
      inputs: [
        {
          kind: 'datapackage',
          // Above we set the "name" for the data package resource to be
          // datapackage.json so we use that name to look it up in rawstoreResponse
          url: dpSignedurl.url,
          parameters: {
            'resource-mapping': resourceMapping,
            'descriptor': dataset.descriptor
          }
        }
      ],
      outputs,
      processing,
      schedule
    }
  }
}

async function processExcelSheets(resources = [], sheets) {
  const excelFormats = ['xls', 'xlsx']
  const processingSteps = []
  const steps = resources.map(async res => {
    if (excelFormats.includes(res.descriptor.format)) {
      const buffer = await res.buffer
      const workbook = XLSX.read(buffer, {type: 'buffer', bookSheets: true})
      if (sheets === 'all') {
        sheets = Array.from(Array(workbook.SheetNames.length).keys())
        // We are using sheet idx starting from 1 so we need to add 1 to each idx:
        sheets = sheets.map(value => value + 1)
      } else if (sheets) { // When sheets are indexes of sheets separated by ','
        sheets = sheets.split(',').map(value => parseInt(value))
      } else { // Default case
        sheets = [1]
      }
      for (let i of sheets) {
        const rows = await toArray(await xlsxParser(res, false, i-1))
        const schema = await infer(rows)
        const step = {
          input: res.descriptor.name,
          output: `${res.descriptor.name}-sheet-${i}`,
          tabulator: {
            sheet: i
          },
          schema
        }
        processingSteps.push(step)
      }
    }
  })
  await Promise.all(steps)
  return processingSteps
}

function handleOutputs(outputsConfig = {}) {
  const outputs = []
  if (outputsConfig.zip) {
    outputs.push({
      kind: 'zip',
      parameters: {
        'out-file': 'dataset.zip'
      }
    })
  }
  if (outputsConfig.sqlite) {
    outputs.push({
      kind: 'sqlite'
    })
  }
  return outputs
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
  processExcelSheets,
  handleOutputs
}
