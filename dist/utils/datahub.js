'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataHub = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let responseError = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (res) {
    let message;
    let userError;

    if (res.status >= 400 && res.status < 500) {
      let body;
      try {
        body = yield res.json();
      } catch (err) {
        body = {};
      }

      message = (body.error || {}).message;
      userError = true;
    } else {
      message = yield res.text();
      userError = false;
    }

    const err = new Error(message || `Response error - no information. Status code: ${res.status} - ${res.statusText}`);
    err.status = res.status;
    err.userError = userError;

    return err;
  });

  return function responseError(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const EventEmitter = require('events');
const fetch = require('node-fetch');
const FormData = require('form-data');
const lodash = require('lodash');

const { Agent } = require('./agent');
const { Resource } = require('./data'

// TODO
// debug logging - and use to output what we are sending to APIs
// get user id from /auth/check when we login and store it and use it
// get dedicated auth token for the rawstore
// common error handling for fetch stuff ... (?)

);class DataHub extends EventEmitter {
  constructor({ apiUrl, token, ownerid, owner, debug = false }) {
    super();
    this.apiUrl = apiUrl;
    this._token = token;
    this._debug = debug;
    this._ownerid = ownerid;
    this._owner = owner;
    this._agent = new Agent(apiUrl, { debug });
  }

  push(pkg) {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // TODO: exclude remote Resources
      const resources = lodash.clone(pkg.resources
      // Get Package itself (datapackage.json) as an (Inline) Resource
      );const _descriptor = lodash.cloneDeep(pkg.descriptor
      // Add the readme - if it exists
      );if (pkg.readme) {
        _descriptor.readme = pkg.readme;
      }
      const dpJsonResource = Resource.load({
        path: 'datapackage.json',
        name: 'datapackage.json',
        data: _descriptor
      });
      resources.push(dpJsonResource);

      _this._debugMsg('Getting rawstore upload creds');

      const rawstoreUploadCreds = yield _this.rawstoreAuthorize(resources);

      _this._debugMsg('Uploading to rawstore with creds ...');
      _this._debugMsg(rawstoreUploadCreds

      // Upload - we do them in parallel
      );const uploads = resources.map((() => {
        var _ref = (0, _asyncToGenerator3.default)(function* (resource) {
          // TODO: annoying that the serves parses the s3 url so we have to unparse it!
          const creds = rawstoreUploadCreds[resource.descriptor.name];
          const formData = new FormData();
          lodash.forEach(creds.upload_query, function (v, k) {
            formData.append(k, v);
          }
          // We need to compute content length for S3 and don't want form-data to re-read entire stream to get length
          // so we explicitly add it
          // See https://github.com/alexindigo/form-data/blob/655b95988ef2ed3399f8796b29b2a8673c1df11c/lib/form_data.js#L82
          );formData.append('file', resource.stream(), {
            knownLength: resource.size,
            contentType: creds.upload_query['Content-Type']
          });
          const totalLength = formData.getLengthSync

          // Use straight fetch as not interacting with API but with external object store
          ();const res = yield fetch(creds.upload_url, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Length': totalLength
            }
          });
          if (res.status !== 204) {
            const body = yield res.text();
            throw new Error(`Error uploading to rawstore for ${resource.descriptor.path} with code ${res.status} reason ${body}`);
          }
          // Finally add the path to file in the rawstore - this is use by makeSourceSpec
          // TODO: should we use urljoin?
          // eslint-disable-next-line camelcase
          creds.rawstore_url = creds.upload_url + '/' + creds.upload_query.key;
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      })());
      yield _promise2.default.all(uploads);

      _this._debugMsg('Uploads to rawstore: Complete');

      _this._debugMsg('Uploading to source spec store'

      // Upload to SpecStore
      );const spec = makeSourceSpec(rawstoreUploadCreds, _this._ownerid, _this._owner, pkg.descriptor.name);

      _this._debugMsg('Calling source upload with spec');
      _this._debugMsg(spec);

      const token = yield _this._authz('source');
      const res = yield _this._fetch('/source/upload', token, {
        method: 'POST',
        body: spec
      });

      if (res.status === 200) {
        const out = yield res.json();
        _this._debugMsg(out);
        return out;
      }
      throw new Error(responseError(res));
    })();
  }

  rawstoreAuthorize(resources) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      // TODO: README
      // TODO: merge the readme into the descriptor

      const fileData = {};
      resources.forEach(function (resource) {
        fileData[resource.descriptor.name] = {
          length: resource.size,
          md5: resource.hash,
          // Not needed - optional in bitstore API
          // type: 'binary/octet-stream',
          name: resource.descriptor.name
        };
      });

      const body = {
        metadata: {
          owner: _this2._ownerid
        },
        filedata: fileData
      };

      const token = yield _this2._authz('rawstore');
      _this2._debugMsg('Calling rawstore authorize with');
      _this2._debugMsg(body);
      const res = yield _this2._fetch('/rawstore/authorize', token, {
        method: 'POST',
        body
      });

      if (res.status === 200) {
        const out = yield res.json();
        return out.filedata;
      }
      throw new Error((yield responseError(res)));
    })();
  }

  _authz(service) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      _this3._debugMsg(`Getting authz token for ${service} service`);
      const res = yield _this3._fetch(`/auth/authorize?service=${service}`, _this3._token);
      if (res.status !== 200) {
        throw new Error(`Authz server: ${res.statusText}`);
      }
      return (yield res.json()).token;
    })();
  }

  close() {
    this._agent.close();
  }

  _fetch(_url, token, opts = {}) {
    opts.headers = opts.headers || {};
    opts.headers['Auth-Token'] = token;
    return this._agent.fetch(_url, opts);
  }

  _debugMsg(msg_) {
    if (this._debug) {
      let msg = msg_;
      if (lodash.isObject(msg)) {
        msg = (0, _stringify2.default)(msg, null, 2);
      }
      console.log('> [debug] ' + msg);
    }
  }
}

exports.DataHub = DataHub;
const makeSourceSpec = (rawstoreResponse, ownerid, owner, dataset) => {
  const resourceMapping = {};
  lodash.forEach(rawstoreResponse, (uploadInfo, resourceName) => {
    if (resourceName !== 'datapackage.json') {
      resourceMapping[resourceName] = uploadInfo.rawstore_url;
    }
  });
  return {
    meta: {
      version: 1,
      ownerid,
      owner,
      dataset
    },
    inputs: [{
      kind: 'datapackage',
      // Above we set the "name" for the data package resource to be
      // datapackage.json so we use that name to look it up in rawstoreResponse
      url: rawstoreResponse['datapackage.json'].rawstore_url,
      parameters: {
        'resource-mapping': resourceMapping
      }
    }]
  };
};