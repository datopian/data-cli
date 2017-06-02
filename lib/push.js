const axios = require('axios')
const urljoin = require('url-join')

module.exports.push = async() => {
  const token = await getToken(config)
  console.log(token)
}

const getToken = async(config) => {
  let res =  await axios.post(
    urljoin(config.server,'/api/auth/token'),
      {
        'username': config.username,
        'secret': config.secretToken
      }
    ).catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log(`Not able to connect to ${config.server}`)
        process.exit(1)
      }
      if ((err.response && err.response.status === 404) || (err.response && err.response.status === 403)) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data.token
}

module.exports.getToken = getToken
