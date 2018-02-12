const chalk = require('chalk')

// Prints an error message
module.exports = msg => {
  if (msg.message) {
    msg = msg.message
  }
  console.log(`${chalk.red('> Error!')} ${msg}`)
}
