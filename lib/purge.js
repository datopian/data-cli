const axios = require('axios')
const creds = require('./config')
const fs = require('fs')
const urljoin = require('url-join')

module.exports.purge = async() => {
  const config = creds.readConfig()
  if (!checkDpIsThere()) {
    console.error('Aborting: datapckage.json not found!')
    process.exit(1)
  }
  const dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  const token = await getToken(config)
  const resp = await requestPurge(config, dpjson.name, token)
  if (resp.status === 'OK') {
    console.log(`Successfully deleted ${dpjson.name}`)
  } else {
    console.log(`Failed to deleted ${dpjson.name}`)
  }
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
      const statusCodes = [404, 403, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data.token
}


const requestPurge = async (config, packageName, token) => {
  axios.defaults.headers.common['Auth-Token'] = `${token}`
  const res = await axios.delete(
    urljoin(config.server,`/api/package/${config.username}/${packageName}/purge`))
      .catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        console.log(`Not able to connect to ${config.server}`)
        process.exit(1)
      }
      const statusCodes = [400, 403, 500]
      if (err.response && statusCodes.indexOf(err.response.status) > 0) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data
}

const checkDpIsThere = () => {
  let files = fs.readdirSync(process.cwd())
  return files.indexOf('datapackage.json') > -1
}

module.exports.requestPurge = requestPurge
