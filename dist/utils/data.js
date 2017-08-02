'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Package = exports.isPackage = exports.isUrl = exports.parsePackageIdentifier = exports.parsePath = exports.ResourceInline = exports.ResourceRemote = exports.ResourceLocal = exports.Resource = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Data Resource (files) and Data Package objects (datasets)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const url = require('url');

const chardet = require('chardet');
const fetch = require('node-fetch');
const lodash = require('lodash');
const mime = require('mime-types');
const urljoin = require('url-join');
const toArray = require('stream-to-array');
const infer = require('tableschema').infer;

const { csvParser } = require('./parser/csv');
const { xlsxParser } = require('./parser/xlsx');

const DEFAULT_ENCODING = 'utf-8';

/**
 * A single data file - local or remote
 *
 * Key properties
 *
 * descriptor: metadata descriptor for this resource
 * stream: a node stream of the contents of this resource
 * rows: a node object stream over the contents of this resource (if it has a tabular structure)
 *
 * Note:
 *
 * size and hash are direct properties as they are lazily evaluated (if not already specified)
 */
// TODO: support initializing with data
class Resource {

  static load(pathOrDescriptor, { basePath } = {}) {
    let descriptor = null;
    if (lodash.isPlainObject(pathOrDescriptor)) {
      descriptor = lodash.cloneDeep(pathOrDescriptor);
      // NB: data must come first - we could have data and path in which path
      // is not used (data comes from data)
      if (descriptor.data) {
        return new ResourceInline(descriptor, { basePath });
      } else if (descriptor.path) {
        // We want properties already in our descriptor to take priority over
        // those inferred from path so we assign in this order
        descriptor = (0, _assign2.default)(parsePath(descriptor.path), descriptor);
      }
    } else if (lodash.isString(pathOrDescriptor)) {
      descriptor = parsePath(pathOrDescriptor, basePath);
    } else {
      throw new TypeError(`Cannot create Resource with ${pathOrDescriptor}`);
    }

    const isRemote = descriptor.pathType === 'remote' || isUrl(basePath);

    if (isRemote) {
      return new ResourceRemote(descriptor, { basePath });
    }
    return new ResourceLocal(descriptor, { basePath });
  }

  constructor(descriptor, { basePath } = {}) {
    this.descriptor = descriptor;
    this._basePath = basePath;
  }

  get path() {
    throw new Error('This is an abstract base class which you should not instantiate. Use .load() instead');
  }

  /**
  * Get readable stream
  *
  * @returns Promise with readable stream object on resolve
  */
  stream() {
    return null;
  }

  /**
   * Get this file as a buffer (async)
   *
   * @returns: promise which resolves to the buffer
   */
  get buffer() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const stream = yield _this.stream();
      const buffers = yield toArray(stream);
      return Buffer.concat(buffers);
    })();
  }

  /**
  * Get rows
  * @returns Promise with parsed JS objects (depends on file format)
  */
  rows({ keyed } = {}) {
    return this._rows({ keyed });
  }

  _rows({ keyed } = {}) {
    if (this.descriptor.format in parserDatabase) {
      const parser = parserDatabase[this.descriptor.format];
      return parser(this, keyed);
    }
    throw new Error(`We do not have a parser for that format: ${this.descriptor.format}`);
  }

  addSchema() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // Ensure resource is tabular
      if (knownTabularFormats.indexOf(_this2.descriptor.format) === -1) {
        throw new Error('Resource is not in known tabular format.');
      }
      const rows = yield toArray((yield _this2.rows()));
      _this2.descriptor.schema = yield infer(rows);
    })();
  }
}

exports.Resource = Resource;
class ResourceLocal extends Resource {
  get path() {
    return this._basePath ? path.join(this._basePath, this.descriptor.path) : this.descriptor.path;
  }

  stream() {
    return fs.createReadStream(this.path);
  }

  get size() {
    return fs.statSync(this.path).size;
  }

  get hash() {
    return crypto.createHash('md5').update(fs.readFileSync(this.path)).digest('base64');
  }

  get encoding() {
    return chardet.detectFileSync(this.path);
  }
}

exports.ResourceLocal = ResourceLocal;
class ResourceRemote extends Resource {
  get path() {
    return this._basePath ? urljoin(this._basePath, this.descriptor.path) : this.descriptor.path;
  }

  stream() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const res = yield fetch(_this3.path);
      return res.body;
    })();
  }

  get encoding() {
    return DEFAULT_ENCODING;
  }
}

exports.ResourceRemote = ResourceRemote;
class ResourceInline extends Resource {
  constructor(descriptor, { basePath } = {}) {
    super(descriptor, { basePath });

    // JSON is special case ...
    if (lodash.isString(this.descriptor.data)) {
      this._buffer = Buffer.from(this.descriptor.data);
    } else {
      // It is json/javascript
      this._buffer = Buffer.from((0, _stringify2.default)(this.descriptor.data));
    }
  }

  // Not really sure this should exist here ... - have it for tests atm
  get path() {
    return this.descriptor.path;
  }

  get size() {
    return this._buffer.byteLength;
  }

  get hash() {
    return crypto.createHash('md5').update(this._buffer).digest('base64');
  }

  stream() {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(this._buffer);
    return bufferStream;
  }

  rows({ keyed } = {}) {
    if (lodash.isArray(this.descriptor.data)) {
      const rowStream = new stream.PassThrough({ objectMode: true });
      this.descriptor.data.forEach(row => {
        rowStream.write(row);
      });
      rowStream.end();
      return rowStream;
    }
    return this._rows({ keyed });
  }
}

exports.ResourceInline = ResourceInline; // Available parsers per file format

const parserDatabase = {
  csv: csvParser,
  xlsx: xlsxParser,
  xls: xlsxParser

  // List of formats that are known as tabular
};const knownTabularFormats = ['csv', 'tsv', 'dsv'];

const parsePath = exports.parsePath = (path_, basePath = null) => {
  const isItUrl = isUrl(path_) || isUrl(basePath);
  // eslint-disable-next-line no-useless-escape
  const fileName = path_.replace(/^.*[\\\/]/, '');
  const extension = path.extname(fileName);
  return {
    path: path_,
    pathType: isItUrl ? 'remote' : 'local',
    name: fileName.replace(extension, ''),
    format: extension.slice(1),
    mediatype: mime.lookup(path_) || ''
  };
};

const parsePackageIdentifier = exports.parsePackageIdentifier = path_ => {
  return {
    path: path_,
    type: isUrl(path_) ? 'remote' : 'local'
  };
};

const isUrl = exports.isUrl = path_ => {
  const r = new RegExp('^(?:[a-z]+:)?//', 'i');
  return r.test(path_);
};

const isPackage = exports.isPackage = path_ => {
  // If it is a path to file we assume it is not a Package
  // Only exception is 'datapackage.json':
  if (path_.endsWith('datapackage.json')) {
    return true;
  }
  const isItUrl = isUrl(path_);
  if (isItUrl) {
    // Guess by path_'s extension
    // Get path from url
    const pathFromUrl = url.parse(path_).path;
    // Split path by dots
    const splitPath = pathFromUrl.split('.');
    const extension = splitPath.pop();
    if (!extension.includes('/')) {
      return false;
    }
  } else if (fs.lstatSync(path_).isFile()) {
    return false;
  }
  // All other cases are true
  return true;
};

// ========================================================
// Package

/**
 * A collection of data resources
 *
 * Under the hood it stores metadata in data package format.
 */
class Package {
  // TODO: handle owner
  constructor(descriptor = {}, identifier = { path: null, owner: null }) {
    if (!lodash.isPlainObject(descriptor)) {
      throw new TypeError(`To create a new Package please use Package.load`);
    }

    this._descriptor = descriptor;
    this._resources = [];
    this._identifier = identifier;
    this._readme = null;
  }

  // eslint-disable-next-line no-unused-vars
  static load(pathOrDescriptor, { path = null, owner = null } = {}) {
    return (0, _asyncToGenerator3.default)(function* () {
      if (!(lodash.isString(pathOrDescriptor) || lodash.isPlainObject(pathOrDescriptor))) {
        throw new TypeError('Package needs to be created with descriptor Object or identifier string');
      }

      const descriptor = lodash.isPlainObject(pathOrDescriptor) ? pathOrDescriptor : {};
      const _path = lodash.isPlainObject(pathOrDescriptor) ? null : pathOrDescriptor;
      const identifier = _path ? parsePackageIdentifier(_path) : {
        path: null,
        owner
        // TODO: owner if provided should override anything parsed from path

      };const pkg = new Package(descriptor, identifier);
      yield pkg._sync();
      return pkg;
    })();
  }

  // Bootstrap ourselves with {this.path}/datapackage.json and readme if exists
  _sync() {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      const readmePath = _this4._path('README.md');
      // eslint-disable-next-line default-case
      switch (_this4.identifier.type) {
        case 'remote':
          {
            let res = yield fetch(_this4.dataPackageJsonPath);
            _this4._descriptor = yield res.json();
            res = yield fetch(readmePath);
            // May not exist and that is ok!
            if (res.status === 200) {
              _this4._readme = yield res.text();
            }
            break;
          }
        case 'local':
          {
            _this4._descriptor = JSON.parse(fs.readFileSync(_this4.dataPackageJsonPath));
            // Now get README from local disk if exists
            if (fs.existsSync(readmePath)) {
              _this4._readme = fs.readFileSync(readmePath).toString();
            }
            break;
          }
      }

      // Now load each resource ...
      _this4._resources = _this4.descriptor.resources.map(function (resource) {
        return Resource.load(resource, { basePath: _this4.path });
      });
    })();
  }

  get identifier() {
    return this._identifier;
  }

  get descriptor() {
    return this._descriptor;
  }

  get path() {
    return this.identifier.path;
  }

  get dataPackageJsonPath() {
    return this._path('datapackage.json');
  }

  get readme() {
    return this._readme;
  }

  // Array of Resource objects
  get resources() {
    return this._resources;
  }

  addResource(resource) {
    if (lodash.isPlainObject(resource)) {
      this.descriptor.resources.push(resource);
      this.resources.push(Resource.load(resource));
    } else if (lodash.isObject(resource)) {
      // It is already a resource object!
      this.descriptor.resources.push(resource.descriptor);
      this.resources.push(resource);
    } else {
      throw new TypeError(`addResource requirese a resource descriptor or an instantiated resources but got: ${resource}`);
    }
  }

  // Path relative to this package
  _path(offset = null) {
    const path_ = this.path ? this.path.replace('datapackage.json', '') : this.path;
    // TODO: ensure offset is relative (security etc)
    switch (this.identifier.type) {
      case 'local':
        return path.join(path_, offset);
      case 'remote':
        return urljoin(path_, offset);
      case undefined:
        return offset;
      default:
        throw new Error(`Unknown path type: ${this.identifier.type}`);
    }
  }
}
exports.Package = Package;