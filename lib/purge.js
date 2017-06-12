const axios = require('axios')
const chalk = require('chalk')
const creds = require('./config')
const fs = require('fs')
const prompt = require('prompt')
const urljoin = require('url-join')
const utils = require('./utils/common')
const { logger } = require('./utils/log-handler.js')

prompt.message = ''

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
        if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        console.error(err.response.data.message)
        process.exit(1)
      }
      console.error(err.message)
      process.exit(1)
    })
  return res.data
}


const purge = async (force) => {
  const config = creds.readConfig()
  if (!utils.checkDpIsThere()) {
    logger('datapckage.json not found!', 'abort', true)
  }
  const dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  let permission = true
  if(!force) {
    permission = await purgePermission(dpjson)
  }
  if(permission) {
    const token = await getToken(config)
    await requestPurge(config, dpjson.name, token)
    logger(`purged ${dpjson.name}`, 'success')
  }
}

const purgePermission = async (dpjson) => {
  let schema = {
    properties: {
      'Package Name': {
        pattern: `${dpjson.name}`,
        message: `Did not match package name. Type ${chalk.green(dpjson.name)} or re-run the command with --force`,
        required: true
      }
    }
  }
  let warning = `${chalk.yellow('Warning')}: This will ${chalk.bold('permanently delete')} ${chalk.green(dpjson.name)} package from DataHub.`
  warning += '\n\nPlease, type in the name of the package to confirm'

  console.log(warning+'\n')
  prompt.start()
  return new Promise((resolve, reject) => {
    prompt.get(schema, (err, result) => {
      if (err) {
        logger(err.message+'\n', 'error')
        reject(false)
      }
      resolve(true)
    })
  })

}

module.exports.requestPurge = requestPurge
module.exports.purge = purge
module.exports.purgePermission = purgePermission
