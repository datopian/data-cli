const fs = require('fs')
const http = require('http')

const fetch = require('node-fetch')
const opn = require('opn')

const info  = require('./utils/output/info.js')
const config = require('./utils/config')
const wait = require('./utils/output/wait')


const port = 3000


export const login = async function(apiUrl, authUrl) {
  opn(authUrl, {wait: false})
  // now enter a wait loop
  const urlWithToken = await runServer()
  const token = urlWithToken.match(/jwt=(.*)/)[1]
  const userInfo = await module.exports.authenticate(apiUrl, token)
  const info = {
    token: token,
    profile: userInfo.profile
  }
  config.merge(info)
  return 'Token and user info saved in `~/.datahub.json`'
}

// Do authentication here: if authenticated returns userInfo, if not returns login providers
export const authenticate = async (apiUrl, token) => {
  const url = `${apiUrl}/auth/check?jwt=${token}&next=http://localhost:${port}`
	const res = await fetch(url)
  const out = await res.json()
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
