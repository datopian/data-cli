const fs = require('fs')

const axios = require('axios')
const chalk = require('chalk')
const inquirer = require('inquirer')
const urljoin = require('url-join')

const creds = require('./utils/config')
const utils = require('./utils/common')
const { logger } = require('./utils/log-handler.js')
const wait = require('./utils/output/wait')


const requestPurge = async (config, packageName, token) => {
  axios.defaults.headers.common['Auth-Token'] = `${token}`
  const res = await axios.delete(
    urljoin(config.server,`/api/package/${config.username}/${packageName}/purge`))
      .catch(err => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        logger(`Not able to connect to ${config.server}`, 'error', true)
      }
      const statusCodes = [400, 403, 500]
        if (err.response && statusCodes.indexOf(err.response.status) > -1) {
        logger(err.response.data.message, 'error', true)
      }
      logger(err.message, 'error', true)
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
    const stopSpinner = wait('Purging...')
    const token = await utils.getToken(config)
    await requestPurge(config, dpjson.name, token)
    stopSpinner()
    logger(`purged ${dpjson.name}`, 'success')
  }
}

const purgePermission = async (dpjson) => {
  let warning = `${chalk.yellow('Warning')}: This will ${chalk.bold('permanently delete')} ${chalk.green(dpjson.name)} package from DataHub.`
  warning += '\n\nPlease, type in the name of the package to confirm'
  console.log(warning+'\n')
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Data Package name: ',
      validate: (value) => {
        if (value === dpjson.name) {
          return true
        }
        return `Did not match package name. Type ${chalk.green(dpjson.name)} or re-run the command with --force`
      }
    }
  ]
  await inquirer.prompt(questions)
  return true
}

module.exports.requestPurge = requestPurge
module.exports.purge = purge
module.exports.purgePermission = purgePermission
