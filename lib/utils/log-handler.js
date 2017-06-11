const chalk = require('chalk')

const logger = (message='', logType, exit=false, spinner) => {
  // spinner is passed then stop it:
  spinner ? spinner.stop() : void(0)
  
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
      if (exit) {
        process.exit(1)
      }
      break;
    case 'success':
      console.log(`${chalk.bold.green('Success:')} ${message}`)
      break
    default:
      console.log(`${chalk.bold.green('Success:')} ${message}`)
  }
}

module.exports.logger = logger
