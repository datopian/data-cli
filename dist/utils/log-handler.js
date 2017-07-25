'use strict';

const chalk = require('chalk');

const logger = (message = '', logType) => {
  switch (logType) {
    case 'error':
      console.error(`${chalk.bold.red('Error:')} ${message}`);
      break;
    case 'warning':
      console.log(`${chalk.bold.yellow('Warning:')} ${message}`);
      break;
    case 'abort':
      console.error(`${chalk.bold.yellow('Aborting:')} ${message}`);
      break;
    case 'success':
      console.log(`${chalk.bold.green('Success:')} ${message}`);
      break;
    default:
      console.log(message);
  }
};

module.exports.logger = logger;