const rp = require('request-promise-native')

const isAuthenticated = async (config) => {
  const url = `https://datax.phonaris.com/auth/check?jwt=${config.get('token')}`
  const response = await rp.get(url)
  return JSON.parse(response).authenticated
}

module.exports.isAuthenticated = isAuthenticated
