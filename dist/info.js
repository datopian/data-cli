'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { dumpers } = require('./cat');

const infoPackage = pkg => {
  let firstParagraphReadme;
  const readme = pkg.readme || 'No readme is provided';

  if (readme) {
    firstParagraphReadme = readme.substring(0, 200).split(' ');
    firstParagraphReadme.pop();
    firstParagraphReadme = firstParagraphReadme.join(' ');
  }

  let resourcesInfo = `
  \n# RESOURCES\n
  | Name | Format |
  |------|--------|
  `;

  pkg.descriptor.resources.forEach(resource => {
    resourcesInfo += `|${resource.name}|${resource.format || 'N/A'}|\n`;
  });

  const out = `

${firstParagraphReadme} ... *see more below*

${resourcesInfo}

# README

${readme}
`;
  return out;
};

const infoResource = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (resource) {
    const out = yield dumpers.ascii(resource);
    return out;
  });

  return function infoResource(_x) {
    return _ref.apply(this, arguments);
  };
})();

module.exports = {
  infoPackage,
  infoResource
};