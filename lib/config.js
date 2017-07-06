const fs = require('fs')
const ini = require('ini')
const path = require('path')
const expandHomeDir = require('expand-home-dir')
const inquirer = require('inquirer')

const configDir = expandHomeDir('~/.datahub')
const configFile = path.join(configDir, 'config')
const defaultServer = 'http://testing.datapackaged.com'
const defaultBitStore = 'https://bits-staging.datapackaged.com'
const defaultApiUrl = 'http://api.testing.datapackaged.com'

if (!fs.existsSync(configDir)){
  fs.mkdirSync(configDir)
}

const config = async (configPath) => {
  console.log(`\nPlease enter your credentials to authenticate for the DataHub registry server.\n`)
  const questions = [
    {
      type: 'input',
      name: 'username',
      message: 'Username:',
      validate: (value) => {
        if (!value || value === '') {
          return 'Username cannot be empty.'
        }
        return true
      }
    },
    {
      type: 'input',
      name: 'server',
      message: 'Server:',
      default: (value) => {
        return defaultServer
      }
    },
    {
      type: 'input',
      name: 'bitStore',
      message: 'BitStore URL:',
      default: (value) => {
        return defaultBitStore
      }
    },
    {
      type: 'input',
      name: 'api',
      message: 'api url:',
      default: (value) => {
        return defaultApiUrl
      }
    }
  ]
  const result = await inquirer.prompt(questions)
  fs.writeFileSync(configPath, ini.stringify(result))
  console.log(`Configuration saved to: ~/.datahub/config\n`)
}

const readConfig = (configPath=configFile) => {
  if (!fs.existsSync(configPath)){
    return
  }
  let config = ini.parse(fs.readFileSync(configPath, 'utf-8'))
  return config
}

const writeConfig = (configObj, configPath=configFile) => {
  fs.writeFileSync(configPath, ini.stringify(configObj))
}

module.exports.config = config
module.exports.configFile = configFile
module.exports.defaultServer = defaultServer
module.exports.defaultBitStore = defaultBitStore
module.exports.defaultApiUrl = defaultApiUrl
module.exports.readConfig = readConfig
module.exports.writeConfig = writeConfig
