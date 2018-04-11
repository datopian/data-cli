// Packages:
const Raven = require('raven')

// Ours:
const error = require('./output/error')
const {version} = require('../../package.json')
const {installedWithNPM} = require('./tools')


async function handleError(err, {debug = false} = {}) {
  if (process.env.datahub !== 'dev') { // Send report to Sentry if not dev env
    // Setup Sentry:
    Raven.config('https://e29902aa81ed414d867f51bd0d1ab91a:2b18fef80e954ba68d8f4351aab99672@sentry.io/305079', {
      release: version,
      extra: {
        args: process.argv,
        nodejsOrBin: installedWithNPM ? process.version : 'bin'
      }
    })

    await new Promise((resolve, reject) => {
      // Capture errors:
      Raven.captureException(err, (sendErr, eventId) => {
        // Once report is sent resolve the promise. However, we resolve it even
        // if it failed to send a report:
        resolve()
      })
    })
  }
  
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
    if (err.constructor.name === 'Array') {
      err.forEach(err => error(err.message))
    } else {
      error(err)
    }
  }
}

module.exports = {
  handleError,
  error
}
