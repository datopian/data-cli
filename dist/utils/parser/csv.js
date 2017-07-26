'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getParseOptions = exports.csvParser = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const parse = require('csv-parse');

const csvParser = exports.csvParser = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (resource, keyed = false) {
    const stream = yield resource.stream();
    const parseOptions = getParseOptions(resource.descriptor.dialect, keyed);
    return stream.pipe(parse(parseOptions));
  });

  return function csvParser(_x) {
    return _ref.apply(this, arguments);
  };
})();

const getParseOptions = exports.getParseOptions = (dialect, keyed) => {
  const parseOptions = {
    columns: keyed ? true : null,
    ltrim: true
  };
  if (dialect) {
    parseOptions.delimiter = dialect.delimiter || ',';
    parseOptions.rowDelimiter = dialect.lineTerminator;
    parseOptions.quote = dialect.quoteChar || '"';
    if (dialect.doubleQuote !== undefined && dialect.doubleQuote === false) {
      parseOptions.escape = '';
    }
  }

  return parseOptions;
};