'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const parse = require('csv-parse');
const infer = require('tableschema').infer;

const generateDescriptor = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (data, dpName = 'scratchpad') {
    const descriptor = {
      name: dpName,
      resources: [{
        format: 'csv',
        data
      }]
    };

    yield parse(data, function (error, values) {
      if (error) {
        process.stdout.write(error.message);
      } else {
        const headers = values.shift();
        const schema = infer(headers, values);
        descriptor.resources[0].schema = schema;
      }
    });
    return descriptor;
  });

  return function generateDescriptor(_x) {
    return _ref.apply(this, arguments);
  };
})();
module.exports.generateDescriptor = generateDescriptor;