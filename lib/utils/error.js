const error = require('./output/error')

function handleError(err, {debug = false} = {}) {
  // Coerce Strings to Error instances
  if (typeof err === 'string') {
    err = new Error(err)
  }

  if (debug) {
    console.log(`> [debug] handling error: ${err.stack}`)
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error(`Connection error: ${err.message}`)
  } else {
    error(err)
  }
}

module.exports = {
  handleError,
  error
}
