'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const toArray = require('stream-to-array');
const Table = require('cli-table');
const mdTable = require('markdown-table');
const CSV = require('csv-string');
const XLSX = require('xlsx');

const dumpAscii = (() => {
  var _ref = (0, _asyncToGenerator3.default)(function* (resource) {
    const rows = yield toArray((yield resource.rows()));

    // Process.stdout.columns not defined when piping so we assume 100
    const termwidth = process.stdout.columns || 100;
    const numrows = rows[0].length;
    // Algorithm: termwidth - (1 each for each column edge + 1 extra)
    const eachColWidth = Math.floor(Math.max(5, (termwidth - numrows - 1) / numrows));
    const colWidths = Array(numrows).fill(eachColWidth);

    const table = new Table({
      head: rows[0],
      colWidths
    });

    rows.slice(1).forEach(function (row) {
      table.push(row);
    });

    return table.toString();
  });

  return function dumpAscii(_x) {
    return _ref.apply(this, arguments);
  };
})();

const dumpCsv = (() => {
  var _ref2 = (0, _asyncToGenerator3.default)(function* (resource) {
    const rows = yield toArray((yield resource.rows()));
    return CSV.stringify(rows);
  });

  return function dumpCsv(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

const dumpMarkdown = (() => {
  var _ref3 = (0, _asyncToGenerator3.default)(function* (resource) {
    const rows = yield toArray((yield resource.rows()));
    return mdTable(rows);
  });

  return function dumpMarkdown(_x3) {
    return _ref3.apply(this, arguments);
  };
})();

const dumpXlsx = (() => {
  var _ref4 = (0, _asyncToGenerator3.default)(function* (resource) {
    const rows = yield toArray((yield resource.rows()));
    return XLSX.utils.aoa_to_sheet(rows);
  });

  return function dumpXlsx(_x4) {
    return _ref4.apply(this, arguments);
  };
})();

const dumpers = {
  ascii: dumpAscii,
  csv: dumpCsv,
  md: dumpMarkdown,
  xlsx: dumpXlsx
};

module.exports = {
  dumpAscii,
  dumpCsv,
  dumpMarkdown,
  dumpXlsx,
  dumpers
};