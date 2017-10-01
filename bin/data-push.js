#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const inquirer = require('inquirer')
const hri = require('human-readable-ids').hri
const {Dataset, File, xlsxParser} = require('data.js')
const { write: copyToClipboard } = require('clipboardy')
const toArray = require('stream-to-array')
const infer = require('tableschema').infer

// Ours
const config = require('../lib/utils/config')
const {customMarked} = require('../lib/utils/tools.js')
const {handleError} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const {DataHub} = require('../lib/utils/datahub.js')
const {authenticate} = require('../lib/login')
const info = require('../lib/utils/output/info.js')


const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help', 'debug', 'interactive', 'published', 'zip', 'sqlite'],
  alias: {help: 'h', interactive: 'i'}
})

const pushMarkdown = fs.readFileSync(path.join(__dirname, '../docs/push.md'), 'utf8')
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
    info('You need to login in order to push your data. Please, use `data login` command.')
    process.exit(0)
  }
  try {
    const filePath = argv._[0] || process.cwd()
    let dataset
    if (fs.lstatSync(filePath).isFile()) {
      dataset = await prepareDatasetFromFile(filePath)
    } else {
      dataset = await Dataset.load(filePath)
    }

    stopSpinner = wait('Commencing push ...')

    const datahubConfigs = {
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile') ? config.get('profile').id : config.get('id'),
      owner: config.get('profile') ? config.get('profile').username : config.get('username')
    }
    const datahub = new DataHub(datahubConfigs)
    const options = {
      findability: argv.published ? 'published' : 'unlisted',
      sheets: argv.sheets,
      outputs: {
        zip: argv.zip,
        sqlite: argv.sqlite
      }
    }
    await datahub.push(dataset, options)

    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = urljoin(config.get('domain'), datahubConfigs.owner, dataset.descriptor.name)
    try {
      await copyToClipboard(url)
    } catch (err) {
      console.log(`Could not copy to clipboard - ${err.message}`)
    }
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

const prepareDatasetFromFile = async filePath => {
  const pathParts = path.parse(filePath)
  const file = File.load(pathParts.base, {basePath: pathParts.dir})
  // List of formats that are known as tabular
  const knownTabularFormats = ['csv', 'tsv', 'dsv']
  if (knownTabularFormats.includes(file.descriptor.format)) {
    await file.addSchema()
    if (argv.interactive) {
      // Prompt user with headers and fieldTypes
      const headers = file.descriptor.schema.fields.map(field => field.name)
      const fieldTypes = file.descriptor.schema.fields.map(field => field.type)
      const questions = [ask('headers', headers), ask('types', fieldTypes)]
      const answers = await inquirer.prompt(questions)

      if (answers.headers === 'n' & answers.types === 'n') {
        // Maybe nicer exit - user has chosen not to proceed for now ...
        throw new Error('Please, generate datapackage.json and push.')
      }
    }
  }

  let dpName = pathParts.name.replace(/\s+/g, '-').toLowerCase()
  // Add human readable id so that this packge does not conflict with other
  // packages (name is coming from the file name which could just be
  // data.csv)
  dpName += '-' + hri.random()
  const metadata = {
    name: dpName,
    title: '', // TODO: generate from file name (maybe prompt user for it ...)
    resources: []
  }
  const dataset = await Dataset.load(metadata)
  dataset.addResource(file)
  return dataset
}

const ask = (name, data) => {
  return {
    type: 'input',
    name,
    message: `Are these ${name} correct for this dataset:\n[${data}]\ny/n?`,
    default: () => {
      return 'y'
    },
    validate: value => {
      const pass = value.match(/^[y,n]+$/)
      if (pass) {
        return true
      }
      return `Please, provide with following responses 'y' for yes or 'n' for no`
    }
  }
}
