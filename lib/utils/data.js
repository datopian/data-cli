// Data Resource (files) and Data Package objects (datasets)
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const chardet = require('chardet')
const fetch = require('node-fetch')
const lodash = require('lodash')
const mime = require('mime-types')
const parse = require('csv-parse')
const urljoin = require('url-join')


const DEFAULT_ENCODING = 'utf-8'

/**
 * A single data file - local or remote
 */
// TODO: support initializing with data
export class Resource {

  static load(pathOrDescriptor, {basePath}={}) {
    let descriptor = null
    if (lodash.isPlainObject(pathOrDescriptor)) {
      descriptor = lodash.cloneDeep(pathOrDescriptor)
    } else if (lodash.isString(pathOrDescriptor)) {
      descriptor = parsePath(pathOrDescriptor, basePath)
    } else {
      throw Error(`Cannot create Resource with ${pathOrDescriptor}`)
    }

    const isRemote = (descriptor.pathType == 'remote' || isUrl(basePath))

    if (isRemote) {
      return new ResourceRemote(descriptor, {basePath})
    } else {
      return new ResourceLocal(descriptor, {basePath})
    }
  }

  constructor(descriptor, {basePath}={}) {
    this.descriptor = descriptor
    this._basePath = basePath
  }

  get path() {
    throw Error('This is an abstract base class which you should not instantiate. Use .load() instead')
  }

  /**
  * Get readable stream
  * @returns Promise with readable stream object on resolve
  */
  get stream() {
    return null
  }

  /**
  * Get rows
  * @returns Promise with parsed JS objects (depends on file format)
  */
  get rows() {
    return (async () => {
      if (Object.keys(parserDatabase).indexOf(this.descriptor.format) !== -1) {
        const parser = parserDatabase[this.descriptor.format](this.descriptor)
        const stream = await this.stream
        return stream.pipe(parser)
      } else {
        throw "We don't have a parser for that format"
      }
    })()
  }
}

export class ResourceLocal extends Resource {
  get path() {
    return this._basePath ? path.join(this._basePath, this.descriptor.path) : this.descriptor.path
  }

  get stream() {
    return fs.createReadStream(this.path)
  }

  get size() {
    return fs.statSync(this.path).size
  }

  get hash() {
    return crypto.createHash('md5')
      .update(fs.readFileSync(this.path))
      .digest("base64")
  }

  get encoding() {
    return chardet.detectFileSync(path_)
  }
}


export class ResourceRemote extends Resource {
  get path() {
    return this._basePath ? urljoin(this._basePath, this.descriptor.path) : this.descriptor.path
  }

  get stream() {
    return (async () => {
      const res = await fetch(this.path)
      return res.body
    })()
  }

  get encoding() {
    return DEFAULT_ENCODING
  }
}

const csvParser = descriptor => {
  // Need to find out delimiter (?)
  if (descriptor.format === 'csv') {
    const parser = parse()
    return parser
  }
}

// Available parsers per file format
const parserDatabase = {
  csv: csvParser
}

export const parsePath = (path_, basePath=null) => {
  const isItUrl = isUrl(path_) || isUrl(basePath)
    , fileName = path_.replace(/^.*[\\\/]/, '')
    , extension = path.extname(fileName)
  return {
    path: path_,
    pathType: isItUrl ? 'remote' : 'local',
    name: fileName.replace(extension, ""),
    format: extension.slice(1),
    mediatype: mime.lookup(path_) || ''
  }
}

export const parsePackageIdentifier = (path_) => {
  return {
    path: path_,
    type: isUrl(path_) ? 'remote' : 'local'
  }
}

export const isUrl = path_ => {
  let r = new RegExp('^(?:[a-z]+:)?//', 'i')
  return r.test(path_)
}



// TODO: should not really be an export but used in tests ...
export const objectStreamToArray = function(stream, callback) {
  var p = new Promise(function(resolve, reject) {
    var output = [];
    var row
    stream.on('readable', function() {
      while(row = stream.read()) {
        output.push(row);
      }
    });
    stream.on('error', function(error) {
      reject(error);
    });
    stream.on('finish', function() {
      resolve(output);
    });
  });
  return p;
}


// ========================================================
// Package


/**
 * A collection of data resources
 *
 * Under the hood it stores metadata in data package format.
 */
export class Package {
  // TODO: handle owner
  constructor(descriptor={}, identifier={path: null, owner: null}) {
    if ( !lodash.isPlainObject(descriptor) ) {
      throw Error(`To create a new Package please use Package.load`)
    }

    this._descriptor = descriptor
    this._resources = []
    this._identifier = identifier
    this._readme = null
  }

  static async load(pathOrDescriptor, { path = null, owner = null }={}) {
    if (
      ! ( lodash.isString(pathOrDescriptor) || lodash.isPlainObject(pathOrDescriptor) )
    ) {
      throw Error('Package needs to be created with descriptor Object or identifier string')
    }

    const descriptor = lodash.isPlainObject(pathOrDescriptor) ? pathOrDescriptor : {}
    const _path = lodash.isPlainObject(pathOrDescriptor) ? null : pathOrDescriptor
    const identifier = _path ? parsePackageIdentifier(_path) : { 
      path: null,
      owner: owner
    }

    const pkg = new Package(descriptor, identifier)
    await pkg._sync()
    return pkg
  }

  // bootstrap ourselves with {this.path}/datapackage.json and readme if exists
  async _sync() {
    const readmePath = this._path('README.md')
    switch (this.identifier.type) {
      case 'remote':
        let res = await fetch(this.dataPackageJsonPath)
        this._descriptor = res.json()
        res = await fetch(readmePath)
        // may not exist and that is ok!
        if (res.status == 200) {
          this._readme = res.text()
        }
      case 'local':
        this._descriptor = JSON.parse(fs.readFileSync(this.dataPackageJsonPath))
        // Now get README from local disk if exists
        if (fs.existsSync(readmePath)) {
          this._readme = fs.readFileSync(readmePath).toString()
        }
    }

    // now load each resource ...
    this._resources = this.descriptor.resources.map(resource => {
      return Resource.load(resource, {basePath: this.path})
    })
  }

  get identifier() {
    return this._identifier
  }

  get descriptor() {
    return this._descriptor
  }

  get path() {
    return this.identifier.path
  }

  get dataPackageJsonPath() {
    return this._path('datapackage.json')
  }

  get readme() {
    return this._readme
  }

  // array of Resource objects
  get resources() {
    return this._resources
  }

  // path relative to this package
  _path(offset=null) {
    // TODO: ensure offset is relative (security etc)
    switch (this.identifier.type) {
      case 'local':
        return path.join(this.path, offset)
      case 'remote':
        return urljoin(this.path, 'datapackage.json')
      default:
        throw Error(`Unknown path type: ${this.identifier.type}`)
    }
  }
}
