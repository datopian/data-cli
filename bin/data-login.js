#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const minimist = require('minimist')
const {customMarked} = require('../lib/utils/tools.js')

const config = require('../lib/utils/config')
const {handleError} = require('../lib/utils/error')
const info = require('../lib/utils/output/info.js')
const {login, authenticate} = require('../lib/login')
const wait = require('../lib/utils/output/wait')

const argv = minimist(process.argv.slice(2), {
  string: ['login'],
  boolean: ['help'],
  alias: {help: 'h'}
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
  let stopSpinner = wait('Logging in ...')
  const apiUrl = config.get('api')
  const token = config.get('token')
  let out

  try {
    out = await authenticate(apiUrl, token)
  } catch (err) {
    handleError(err)
    process.exit(1)
  }

  if (out.authenticated) {
    stopSpinner()
    info('You are already logged in.')
    process.exit(0)
  }
  // Signup or signin
  stopSpinner()

  const authUrl = out.providers.google.url
  info('Opening browser and waiting for you to authenticate online')
  let msg
  try {
    msg = await login(apiUrl, authUrl)
  } catch (err) {
    handleError(err)
  }
  info(msg)
  process.exit(0)
})
