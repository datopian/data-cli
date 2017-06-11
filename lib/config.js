const fs = require('fs');
const ini = require('ini');
const path = require('path');
const expandHomeDir = require('expand-home-dir')
const prompt = require('prompt');

const configDir = expandHomeDir('~/.datahub')
const configFile = path.join(configDir, 'config')
const defaultServer = 'https://staging.datapackaged.com'

if (!fs.existsSync(configDir)){
  fs.mkdirSync(configDir);
}

const config = (configPath) => {
  process.stdout.write(
`\nPlease enter your credentials to authenticate
for the DataHub registry server.\n`
  )

  const schema = {
    properties: {
      username: {
        description: 'Username',
        message: 'Username should not be empty!',
        required: true
      },
      secretToken: {
        description: 'Your secret token (input hidden)',
        message: 'Secret token should not be empty!',
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
    process.stdout.write(`Configuration saved to: ~/.datahub/config\n`)
  })
}

const readConfig = (configPath=configFile) => {
  if (!fs.existsSync(configPath)){
    return
  }
  let config = ini.parse(fs.readFileSync(configPath, 'utf-8'))
  return config
}

module.exports.config = config
module.exports.configFile = configFile
module.exports.defaultServer = defaultServer
module.exports.readConfig = readConfig
