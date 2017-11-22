#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const {Dataset} = require('data.js')
const { write: copyToClipboard } = require('clipboardy')

// Ours
const {config} = require('datahub')
const {customMarked} = require('datahub')
const {handleError} = require('datahub')
const {wait} = require('datahub')
const {DataHub} = require('datahub')
const {authenticate} = require('datahub')
const {infoOutput} = require('datahub')


const argv = minimist(process.argv.slice(2), {
  string: ['push-flow'],
  boolean: ['help', 'debug', 'interactive'],
  alias: {help: 'h', interactive: 'i'}
})

const pushMarkdown = fs.readFileSync(path.join(__dirname, '../docs/push-flow.md'), 'utf8')
const help = () => {
  console.log('\n' + customMarked(pushMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

Promise.resolve().then(async () => {
  let stopSpinner = () => {}
  // First check if user is authenticated
  const apiUrl = config.get('api')
  const token = config.get('token')
  let out
  try {
    out = await authenticate(apiUrl, token)
  } catch (err) {
    handleError(err)
    process.exit(1)
  }
  if (!out.authenticated) {
    infoOutput('You need to login in order to push your data. Please, use `data login` command.')
    process.exit(0)
  }
  try {
    const datasetPath = argv._[0] || process.cwd()
    dataset = await Dataset.load(datasetPath)
    stopSpinner = wait('Commencing push ...')

    const datahub = new DataHub({
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile').id,
      owner: config.get('profile').username
    })
    await datahub.pushFlow(path.join(datasetPath ,'.datahub/flow.yaml'))

    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = urljoin(config.get('domain'), config.get('profile').username, dataset.descriptor.name)
    await copyToClipboard(url)
    console.log(message + '🔗  ' + url + ' (copied to clipboard)')
  } catch (err) {
    stopSpinner()
    handleError(err)
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    process.exit(1)
  }
})
