const axios = require('axios')
const chalk = require('chalk')
const creds = require('./config')
const fs = require('fs')
const prompt = require('prompt')
const urljoin = require('url-join')

prompt.message = ''

module.exports.purge = async(force) => {
  const config = creds.readConfig()
  if (!checkDpIsThere()) {
    console.error('Aborting: datapckage.json not found!')
    process.exit(1)
  }
  const dpjson = JSON.parse(fs.readFileSync('datapackage.json').toString())
  let schema = {
    properties: {
      'Package Name': {
        pattern: `${dpjson.name}`,
        message: `Did not match with package name. Type ${chalk.green(dpjson.name)} or re-run this command with --force`,
        required: true
      }
    }
  }
  let warning = `${chalk.yellow('Warning')}: This will ${chalk.bold('permanently delete')} ${chalk.green(dpjson.name)} package from DataHub.

Please type in the name of the package to confirm`

  let permission = false

  if (!force) {
    console.log(warning+'\n')
    prompt.start()
    prompt.get(schema, async (err, result) => {
      if (err) {
        return console.error(err.message+'\n');
      }
      permission = true
    })
  } else {
    permission = true
  }

  if(permission) {
    const token = await getToken(config)
    await requestPurge(config, dpjson.name, token)
    console.log(`Successfully deleted ${dpjson.name}`)
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
        if (err.response && statusCodes.indexOf(err.response.status) > -1) {
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
