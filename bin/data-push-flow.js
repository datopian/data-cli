#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const {DataHub} = require('datahub-client')
const {authenticate} = require('datahub-client')
const {config} = require('datahub-client')
const { write: copyToClipboard } = require('clipboardy')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const {handleError} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const info = require('../lib/utils/output/info.js')


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
    await handleError(err)
    process.exit(1)
  }
  if (!out.authenticated) {
    info('You need to login in order to push your data. Please, use `data login` command.')
    process.exit(0)
  }
  try {
    const datasetPath = argv._[0] || process.cwd()
    stopSpinner = wait('Commencing push ...')

    const datahubConfigs = {
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile') ? config.get('profile').id : config.get('id'),
      owner: config.get('profile') ? config.get('profile').username : config.get('username')
    }
    const datahub = new DataHub(datahubConfigs)
    const res = await datahub.pushFlow(
      path.join(datasetPath ,'.datahub/flow.yaml'),
      path.join(datasetPath ,'.datahub/datapackage.json')
    )
    const revisionId = res.flow_id.split('/').pop()
    const datasetName = res.dataset_id.split('/').pop()
    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = urljoin(config.get('domain'), datahubConfigs.owner, datasetName,'v',revisionId)
    await copyToClipboard(url)
    console.log(message + '🔗  ' + url + ' (copied to clipboard)')
  } catch (err) {
    stopSpinner()
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    await handleError(err)
    process.exit(1)
  }
})
