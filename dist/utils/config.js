'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { homedir } = require('os');
const path = require('path');
const fs = require('fs');

const nconf = require('nconf');

const file = process.env.DATAHUB_JSON ? path.resolve(process.env.DATAHUB_JSON) : path.resolve(homedir(), '.datahub.json');

nconf.argv().env().file({
  file
}

// This is the object that you want to override in your own local config
);nconf.defaults({
  api: 'https://api.datahub.io',
  domain: 'https://datahub.io',
  token: '',
  email: '',
  username: ''
});

function save(data) {
  fs.writeFileSync(file, (0, _stringify2.default)(data, null, 2));
}

/**
 * Reads the config file
 *
 * @return {Object}
 */
function read() {
  let existing = {};
  try {
    existing = fs.readFileSync(file, 'utf8');
    existing = JSON.parse(existing);
  } catch (err) {}

  return existing;
}

/**
 * Merges the `data` object onto the
 * JSON config stored in `.datahub.json`.
 *
 * (atomic)
 * @param {Object} data
 */
function merge(data) {
  const cfg = (0, _assign2.default)({}, read(), data);
  save(cfg);
}

module.exports = {
  get: nconf.get.bind(nconf),
  set: nconf.set.bind(nconf),
  reset: nconf.reset.bind(nconf),
  merge
};