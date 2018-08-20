#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const inquirer = require('inquirer')

const {customMarked} = require('../lib/utils/tools.js')
const {config} = require('datahub-client')
const {handleError} = require('../lib/utils/error')
const info = require('../lib/utils/output/info.js')
const {login, authenticate} = require('datahub-client')
const wait = require('../lib/utils/output/wait')

const argv = minimist(process.argv.slice(2), {
  string: ['login'],
  boolean: ['help', 'interactive'],
  alias: {help: 'h', interactive: 'i'}
})

const configMarkdown = fs.readFileSync(path.join(__dirname, '../docs/login.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(configMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

Promise.resolve().then(async () => {
  const stopSpinner = wait('Logging in ...')
  const apiUrl = config.get('api')
  const token = config.get('token')
  let out

  try {
    out = await authenticate(apiUrl, token)
  } catch (err) {
    await handleError(err)
    process.exit(1)
  }
  if (out.authenticated) {
    stopSpinner()
    info('You are already logged in.')
    process.exit(0)
  }
  // Signup or signin
  stopSpinner()

  // Do choosing login method here
  const loginChoices = Object.keys(out.providers).map(provider => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  })
  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'loginProvider',
      message: 'Login with...',
      choices: loginChoices,
      filter: val => {
        return val.toLowerCase()
      }
    }
  ])
  const authUrl = out.providers[result.loginProvider].url
  info('Opening browser and waiting for you to authenticate online')
  if (argv.interactive) {
    info('Please, copy and paste following URL in your browser:\n' + authUrl)
  } else {
    info('Note: If nothing is loaded in browser please run `data login -i`')
  }

  try {
    await login(apiUrl, authUrl, config.get('domain'))
  } catch (err) {
    await handleError(err)
    process.exit(1)
  }
  info('You are logged in!')
  process.exit(0)
})
