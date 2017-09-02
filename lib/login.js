const http = require('http')

const fetch = require('node-fetch')
const opn = require('opn')

const config = require('./utils/config')

const port = 3000

const login = async function (apiUrl, authUrl) {
  opn(authUrl, {wait: false})
  // Now enter a wait loop
  const urlWithToken = await runServer()
  const token = urlWithToken.match(/jwt=(.*)/)[1]
  const userInfo = await module.exports.authenticate(apiUrl, token)
  const info = {
    token,
    profile: userInfo.profile
  }
  config.merge(info)
}

// Do authentication here: if authenticated returns userInfo, if not returns login providers
const authenticate = async (apiUrl, token) => {
  const url = `${apiUrl}/auth/check?jwt=${token}&next=http://localhost:${port}`
  const res = await fetch(url)
  const out = await res.json()
  return out
}

module.exports.logout = function () {
  // TODO: delete token ...
}

const runServer = async function () {
  return new Promise((resolve, reject) => {
    const requestHandler = (request, response) => {
      if (request.url.match(/\?jwt=/)) {
        response.end('Thank you for logging in. You can now close this window and return to the terminal!')
        resolve(request.url)
        server.close()
      }
    }

    const server = http.createServer(requestHandler)
    server.listen(port, 'localhost', (port, err) => {
      if (err) {
        console.log('something bad happened')
        reject(err)
      }
    })
  })
}

module.exports = {
  login,
  authenticate
}
