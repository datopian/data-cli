'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.csvParser = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const parse = require('csv-parse');

const csvParser = exports.csvParser = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (resource, keyed = false) {
    const stream = yield resource.stream();
    const columns = keyed ? true : null;
    return stream.pipe(parse({ columns }));
  });

  return function csvParser(_x) {
    return _ref.apply(this, arguments);
  };
})();