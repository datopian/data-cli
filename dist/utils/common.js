'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require('fs');

const urljoin = require('url-join');
const axios = require('axios');

const checkDpIsThere = (path_ = process.cwd()) => {
  const files = fs.readdirSync(path_);
  return files.indexOf('datapackage.json') > -1;
};

const getMetadata = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (publisher, pkg, sUrl) {
    const apiUrl = `${sUrl}/api/package/${publisher}/${pkg}`;
    const res = yield axios.get(apiUrl).catch(function (err) {
      if (err.response && err.response.status === 404) {
        throw new Error('Data Package Not Found');
      } else {
        throw new Error(err.message);
      }
    });
    return res.data;
  });

  return function getMetadata(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
})();

const getToken = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (config) {
    const res = yield axios.post(urljoin(config.server, '/api/auth/token'), {
      username: config.username,
      secret: config.secretToken
    }).catch(function (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        // logger(`Not able to connect to ${config.server}`, 'error', true)
      }
      const statusCodes = [400, 404, 403, 500];
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {}
      // logger(err.response.data.message, 'error', true)

      // logger(err.message, 'error', true)
    });
    return res.data.token;
  });

  return function getToken(_x4) {
    return _ref2.apply(this, arguments);
  };
})();

// TODO: should not really be an export but used in tests ...
exports.objectStreamToArray = function (stream) {
  const p = new _promise2.default((resolve, reject) => {
    const output = [];
    let row;
    stream.on('readable', () => {
      // eslint-disable-next-line no-cond-assign
      while (row = stream.read()) {
        output.push(row);
      }
    });
    stream.on('error', error => {
      reject(error);
    });
    stream.on('finish', () => {
      resolve(output);
    });
  });
  return p;
};

module.exports.checkDpIsThere = checkDpIsThere;
module.exports.getMetadata = getMetadata;
module.exports.getToken = getToken;