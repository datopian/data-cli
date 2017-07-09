// Data Resource (files) and Data Package objects (datasets)
const path = require('path')
const fs = require('fs')

const mime = require('mime-types')
const chardet = require('chardet')
const axios = require('axios')
const parse = require('csv-parse')


/**
 * A single data file - local or remote
 */
export class Resource {
  constructor(pathOrDescriptor) {
    if (pathOrDescriptor.constructor.name === 'String') {
      this.descriptor = parsePath(pathOrDescriptor)
    } else {
      this.descriptor = pathOrDescriptor
    }
  }

  /**
  * Get readable stream
  * @returns Promise with readable stream object on resolve
  */
  get stream() {
    if (this.descriptor.pathType === 'remote') {
      // create readable stream from remote file
      return (async () => {
        const response = await axios({
          method:'get',
          url: this.descriptor.path,
          responseType:'stream'
        })
        return response.data
      })()
    } else if (this.descriptor.pathType === 'local') {
      return fs.createReadStream(this.descriptor.path)
    } else {
      throw `Unsupported path type: ${this.descriptor.pathType}`
    }
  }

  /**
  * Get rows
  * @returns Promise with parsed JS objects (depends on file format)
  */
  get rows() {
    if (Object.keys(parserDatabase).indexOf(this.descriptor.format) !== -1) {
      const parser = parserDatabase[this.descriptor.format](this.descriptor)
      return this.stream.pipe(parser)
    } else {
      throw "We don't have a parser for that format"
    }
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

export const parsePath = (path_) => {
  const dataResource = {path: path_}
        , isItUrl = isUrl(path_)
        , fileName = path_.replace(/^.*[\\\/]/, '')
        , extension = path.extname(fileName)
        , resourceName = fileName.replace(extension, "")
        , format = extension.slice(1)
        , mimeType = mime.lookup(path_) || ''
  dataResource.pathType = isItUrl ? 'remote' : 'local'
  dataResource.name = resourceName
  dataResource.format = format
  dataResource.mediatype = mimeType
  if (!isItUrl) {
    const encoding = chardet.detectFileSync(path_)
    dataResource.encoding = encoding
  } else {
    dataResource.encoding = null
  }
  return dataResource
}


export const isUrl = path_ => {
  let r = new RegExp('^(?:[a-z]+:)?//', 'i')
  return r.test(path_)
}

// TODO: should not really be an export but used in tests ...
exports.objectStreamToArray = function(stream, callback) {
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

