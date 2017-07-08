const rp = require('request-promise-native')
const opn = require('opn')
const http = require('http')
const md5 = require('md5')
const fs = require('fs')

const { logger } = require('./utils/log-handler')
const { spinner } = require('./utils/tools')
const config = require('../config')


const port = 3000


module.exports.login = async function() {
	logger('Logging in ...')
	spinner.start()

  spinner.text = 'Getting auth url'
  const out = await module.exports.authenticate(config.get('token'))

	if (out.authenticated) {
		logger('You are already logged in.', 'abort', true, spinner)
	}

	spinner.text = 'Opening browser and waiting for you to authenticate online'
  const authUrl = out.providers.google.url
  opn(authUrl, {wait: false})

  // now enter a wait loop
  try {
    const urlWithToken = await runServer()
    spinner.text = 'Getting user info'
    const token = module.exports._extractToken(urlWithToken)
		const userInfo = await module.exports.authenticate(token)
		spinner.text = 'Saving user info'
    const info = {
      token: token,
      email: userInfo.profile.email,
      username: userInfo.profile.username
    }
    config.merge(info)
    logger('Token and user info saved in `~/.datahub.json`', 'success', true, spinner)
  } catch(err) {
    logger(err, 'abort', true, spinner)
  }
}

// extract token from returned url
module.exports._extractToken = function(urlWithToken) {
  const token = urlWithToken.match(/jwt=(.*)/)[1]
  return token
}

// Do authentication here: if authenticated returns userInfo, if not returns login providers
export const authenticate = async (token) => {
  const uri = `${config.get('api')}/auth/check?jwt=${token}&next=http://localhost:${port}`
	const out = await rp({
    uri: uri,
    json: true
  })
  return out
}

module.exports.logout = function() {
  // TODO: delete token ...
}

const runServer = async function() {
  return new Promise(function(resolve, reject) {
    const requestHandler = (request, response) => {
      if (request.url.match(/\?jwt=/)) {
        response.end('Thank you for logging in. You can now close this window and return to the terminal!')
        resolve(request.url)
        server.close()
      }
    }

    const server = http.createServer(requestHandler)
    server.listen(port, (err) => {
      if (err) {
        return console.log('something bad happened', err)
        resolve(err)
      }
    })
  });
}
