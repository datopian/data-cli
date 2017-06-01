const fs = require('fs');
const ini = require('ini');
const path = require('path');
const expandHomeDir = require('expand-home-dir')
const prompt = require('prompt');

const configDir = expandHomeDir('~/.datahub')
const defaultServer = 'https://staging.datapackaged.com'

if (!fs.existsSync(configDir)){
  fs.mkdirSync(configDir);
}

exports.configFile = path.join(configDir, 'config')
exports.defaultServer = defaultServer

exports.configure = function(configPath) {
  process.stdout.write(
`Please enter your credentials to authenticate
for the DataHub registry server.\n`
  )

  let schema = {
    properties: {
      username: {
        description: 'Username',
        message: 'Username should not be empty!',
        required: true
      },
      accessToken: {
        description: 'Your access token (input hidden)',
        message: 'Access token should not be empty!',
        required: true,
        hidden: true
      },
      server: {
        description: 'Server URL',
        default: defaultServer
      }
    }
  }
  prompt.message = ''
  prompt.start()
  prompt.get(schema, function (err, result) {
    if (err) {
      return process.stderr.write(err.message+'\n');
    }
    fs.writeFileSync(configPath, ini.stringify(result))
    process.stdout.write(`Configuration saved to: ${configPath}\n`)
  })
}

exports.readConfig = function(configPath=this.configFile) {
  if (!fs.existsSync(configPath)){
    return
  }
  let config = ini.parse(fs.readFileSync(configPath, 'utf-8'))
  return config
}
