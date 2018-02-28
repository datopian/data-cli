const url = require('url')
const http = require('http')

module.exports = path => {
  const parsedUrl = url.parse(path)
  const options = {method: 'HEAD', host: parsedUrl.host, port: 80, path: parsedUrl.path}
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
        resolve(res.statusCode)
      }
    )
    req.end()
  })
}
