'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Profile = exports.validateMetadata = exports.validateData = exports.validate = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let validate = exports.validate = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (descriptor, basePath) {
    try {
      yield validateMetadata(descriptor);
      for (let i = 0; i < descriptor.resources.length; i++) {
        // TODO what if resource is remote
        const resource = Resource.load(descriptor.resources[i], { basePath });
        if (resource.descriptor.format === 'csv') {
          yield validateData(resource.descriptor.schema, resource.path);
        }
      }
      return true;
    } catch (err) {
      return err;
    }
  });

  return function validate(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

let validateData = exports.validateData = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (schema, absPath) {
    // TODO: handle inlined data resources
    const table = yield Table.load(absPath, { schema });
    yield table.read();
    return true;
  });

  return function validateData(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

let validateMetadata = exports.validateMetadata = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (descriptor) {
    // If descriptor has a profile property then use it
    // Else use the latest schema
    const defaultProfile = descriptor.profile || 'data-package';

    const profile = yield Profile.load(defaultProfile

    // Validate descriptor
    );return profile.validate(descriptor);
  });

  return function validateMetadata(_x5) {
    return _ref3.apply(this, arguments);
  };
})();

// Profile class extracted from datapackage-js library


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const tv4 = require('tv4');
const fetch = require('node-fetch');
const { Table } = require('tableschema');

const { Resource, isUrl } = require('./utils/data');

class Profile {

  static load(profile) {
    return (0, _asyncToGenerator3.default)(function* () {
      let jsonschema = _cache[profile];
      if (!jsonschema) {
        // Remote
        if (isUrl(profile)) {
          try {
            const response = yield fetch(profile);
            jsonschema = yield response.json();
          } catch (err) {
            throw new Error('Can not retrieve remote profile ' + profile);
          }

          // Local
        } else {
          try {
            const schemaPath = './schema/' + profile + '.json';
            jsonschema = require(schemaPath);
          } catch (err) {
            throw new Error('Profiles registry hasn\'t profile ' + profile);
          }
        }

        _cache[profile] = jsonschema;
      }
      return new Profile(jsonschema);
    })();
  }

  get name() {
    if (this._jsonschema.title) {
      return this._jsonschema.title.replace(' ', '-').toLowerCase();
    }
    return null;
  }

  get jsonschema() {
    return this._jsonschema;
  }

  /**
   * Validate descriptor
   *
   */
  validate(descriptor) {
    const validation = tv4.validateMultiple(descriptor, this._jsonschema);
    if (!validation.valid) {
      const errors = [];
      for (const error of validation.errors) {
        errors.push(new Error(`Descriptor validation error:
          ${error.message}
          at "${error.dataPath}" in descriptor and
          at "${error.schemaPath}" in profile`));
      }
      throw errors;
    }
    return true;
  }

  // Private

  constructor(jsonschema) {
    this._jsonschema = jsonschema;
  }

}

exports.Profile = Profile; // Internal

const _cache = {};