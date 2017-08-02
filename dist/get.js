'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require('fs');
const path = require('path');
const url = require('url');
const axios = require('axios');
const chalk = require('chalk');
const Datapackage = require('datapackage').Datapackage;
const mkdirp = require('mkdirp');
const urljoin = require('url-join');
const utils = require('./utils/common');
const { bar } = require('./utils/tools');

module.exports.get = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (pkgid) {
    const start = new Date();
    const idObj = utils.parseIdentifier(pkgid);
    let dpObj;
    dpObj = yield new Datapackage(idObj.dataPackageJsonPath);

    const dist = checkDestIsEmpty(idObj.owner, idObj.name);
    throw new Error(`${idObj.owner}/${idObj.name} is not empty!`);

    const filesToDownload = getFilesToDownload(idObj.path, dpObj.descriptor);
    const len = filesToDownload.length;
    bar.total = len;
    bar.tick({
      download: 'Getting data package'
    });

    const downloads = [];
    filesToDownload.forEach(function (file) {
      downloads.push(downloadFile(file.url, file.destPath, idObj.owner, idObj.name, bar));
    });

    _promise2.default.all(downloads).then(function () {
      bar.tick(len - 1, {
        download: 'Completed downloads'
      });
      const end = new Date() - start;
      console.log(chalk.green('Time elapsed: ') + (end / 1000).toFixed(2) + 's');
    });
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();

const checkDestIsEmpty = (owner, name) => {
  const dest = path.join(owner, name);
  if (!fs.existsSync(dest)) {
    return true;
  }
  if (fs.readdirSync(dest).length === 0) {
    return true;
  }
  return false;
};

const getFilesToDownload = (path_, descriptor) => {
  const files = [{ destPath: 'datapackage.json', url: urljoin(path_, 'datapackage.json') }, { destPath: 'README', url: urljoin(path_, 'README') }, { destPath: 'README.md', url: urljoin(path_, 'README.md') }, { destPath: 'README.txt', url: urljoin(path_, 'README.txt') }];
  const resources = descriptor.resources;
  resources.forEach(resource => {
    let resourceUrl = `${path_}/${resource.path}`;
    if (resource.url) {
      resourceUrl = resource.url;
    }

    let destPath = resource.path;
    if (resource.url) {
      const filename = url.parse(resource.url).pathname.split('/').pop();
      destPath = path.join('data', filename);
    }

    files.push({ destPath, url: resourceUrl });
  });
  return files;
};

const downloadFile = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (path_, dest, owner, name, bar) {
    const res = yield axios.get(path_, { responseType: 'stream' }).catch(function (err) {
      if (err.response && err.response.status === 404) {
        if (dest.includes('README')) {
          return;
        }
        console.error(`Data Not Found For ${dest}`);
      } else if (err.code === 'ECONNREFUSED') {
        console.error(`Not able to connect to the server`);
      } else {
        console.error(`Failed to retrieve ${dest}`);
        console.error(err.message);
      }
    });
    if (!res) {
      return;
    }
    const destPath = path.join(owner, name, dest);
    mkdirp.sync(path.dirname(destPath));
    res.data.pipe(fs.createWriteStream(destPath));
    bar.tick();
  });

  return function downloadFile(_x2, _x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
})();

module.exports.checkDestIsEmpty = checkDestIsEmpty;
module.exports.downloadFile = downloadFile;
module.exports.getFilesToDownload = getFilesToDownload;