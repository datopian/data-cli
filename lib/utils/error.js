const error = require('./output/error')

function handleError(err, { debug = false } = {}) {
  // Coerce Strings to Error instances
  if (typeof err === 'string') {
    err = new Error(err)
  }

  if (debug) {
    console.log(`> [debug] handling error: ${err.stack}`)
  }

  error(err.message)
}

module.exports = {
  handleError,
  error
}
