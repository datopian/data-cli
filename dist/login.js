'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.authenticate = exports.login = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const http = require('http');

const fetch = require('node-fetch');
const opn = require('opn');

const config = require('./utils/config');

const port = 3000;

const login = exports.login = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (apiUrl, authUrl) {
    opn(authUrl, { wait: false }
    // Now enter a wait loop
    );const urlWithToken = yield runServer();
    const token = urlWithToken.match(/jwt=(.*)/)[1];
    const userInfo = yield module.exports.authenticate(apiUrl, token);
    const info = {
      token,
      profile: userInfo.profile
    };
    config.merge(info);
    return 'Token and user info saved in `~/.datahub.json`';
  });

  return function login(_x, _x2) {
    return _ref.apply(this, arguments);
  };
})();

// Do authentication here: if authenticated returns userInfo, if not returns login providers
const authenticate = exports.authenticate = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (apiUrl, token) {
    const url = `${apiUrl}/auth/check?jwt=${token}&next=http://localhost:${port}`;
    const res = yield fetch(url);
    const out = yield res.json();
    return out;
  });

  return function authenticate(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

module.exports.logout = function () {
  // TODO: delete token ...
};

const runServer = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* () {
    return new _promise2.default(function (resolve, reject) {
      const requestHandler = function (request, response) {
        if (request.url.match(/\?jwt=/)) {
          response.end('Thank you for logging in. You can now close this window and return to the terminal!');
          resolve(request.url);
          server.close();
        }
      };

      const server = http.createServer(requestHandler);
      server.listen(function (port, err) {
        if (err) {
          console.log('something bad happened', err);
          reject(err);
        }
      });
    });
  });

  return function runServer() {
    return _ref3.apply(this, arguments);
  };
})();