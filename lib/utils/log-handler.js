const chalk = require('chalk')

const logger = (message='', logType, exit=false) => {
  switch (logType) {
    case 'error':
      console.error(`${chalk.bold.red('Error:')} ${message}`)
      if (exit) {
        process.exit(1)
      }
      break;
    case 'warning':
      console.log(`${chalk.bold.yellow('Warning:')} ${message}`)
      break;
    case 'abort':
      console.error(`${chalk.bold.yellow('Aborting:')} ${message}`)
      break;
    case 'success':
      console.log(`${chalk.bold.green('Success:')} ${message}`)
      break
    default:
      console.log(`${chalk.bold.green('Success:')} ${message}`)
  }
}

module.exports.logger = logger
