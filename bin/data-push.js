#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const inquirer = require('inquirer')
const hri = require('human-readable-ids').hri
const {Dataset, File, xlsxParser, isDataset, isUrl} = require('data.js')
const { write: copyToClipboard } = require('clipboardy')
const toArray = require('stream-to-array')
const {config} = require('datahub-client')
const {DataHub} = require('datahub-client')
const {authenticate} = require('datahub-client')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const {handleError} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const info = require('../lib/utils/output/info.js')


const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help', 'debug', 'interactive', 'published', 'private', 'zip', 'sqlite'],
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
    if (isDataset(filePath)) {
      if (isUrl(filePath)) {
        console.log('Error: You can push only local datasets.')
        process.exit(0)
      }
      dataset = await Dataset.load(filePath)
    } else {
      dataset = await prepareDatasetFromFile(filePath)
    }
    stopSpinner = wait('Commencing push ...')

    const datahubConfigs = {
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile') ? config.get('profile').id : config.get('id'),
      owner: config.get('profile') ? config.get('profile').username : config.get('username')
    }
    let findability = 'unlisted'
    if (argv.published) {
      findability = 'published'
    }
    if (argv.private) {
      findability = 'private'
    }
    const datahub = new DataHub(datahubConfigs)
    const options = {
      findability: findability,
      sheets: argv.sheets ? argv.sheets.toString() : undefined,
      outputs: {
        zip: argv.zip,
        sqlite: argv.sqlite
      },
      schedule: argv.schedule
    }
    let res = await datahub.push(dataset, options)
    let revisionId = res.flow_id.split('/').pop()
    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = urljoin(config.get('domain'), datahubConfigs.owner, dataset.descriptor.name,'v',revisionId)
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
  let file
  if (isUrl(filePath)) {
    file = await File.load(filePath, {format: argv.format})
  } else {
    const pathParts = path.parse(filePath)
    file = await File.load(pathParts.base, {basePath: pathParts.dir, format: argv.format})
  }
  // List of formats that are known as tabular
  const knownTabularFormats = ['csv', 'tsv', 'dsv']
  if (knownTabularFormats.includes(file.descriptor.format)) {
    await file.addSchema()
    if (argv.interactive) {
      // Prompt user with headers and fieldTypes
      const headers = file.descriptor.schema.fields.map(field => field.name)
      const fieldTypes = file.descriptor.schema.fields.map(field => field.type)
      const questions = [
        ask('headers', headers, 'y', 'yesOrNo'),
        ask('types', fieldTypes, 'y', 'yesOrNo')
      ]
      const answers = await inquirer.prompt(questions)

      if (answers.headers === 'n' & answers.types === 'n') {
        // Maybe nicer exit - user has chosen not to proceed for now ...
        throw new Error('Please, generate datapackage.json and push.')
      }
    }
  }

  let dpName, dpTitle
  if (argv.name) {
    dpName = argv.name
  } else {
    dpName = file.descriptor.name.replace(/\s+/g, '-').toLowerCase()
    // Add human readable id so that this packge does not conflict with other
    // packages (name is coming from the file name which could just be
    // data.csv)
    dpName += '-' + hri.random()
    // Confirm dpName with user:
    const answer = await inquirer.prompt([ask('name', dpName, dpName, 'nameValidation')])
    dpName = answer.name
  }

  // Make unslugifies version for title:
  dpTitle = dpName.replace(/-+/g, ' ')
  dpTitle = dpTitle.charAt(0).toUpperCase() + dpTitle.slice(1)
  // Confirm title with user:
  const answer = await inquirer.prompt([ask('title', dpTitle, dpTitle)])

  const metadata = {
    name: dpName,
    title: answer.title,
    resources: []
  }
  const dataset = await Dataset.load(metadata)
  dataset.addResource(file)
  return dataset
}

const validationPatterns = {
  yesOrNo: /^[y,n]+$/,
  nameValidation: /^([-a-z0-9._\/])+$/
}

const ask = (property, data, defaultValue, validation) => {
  const inquirerObj = {
    type: 'input',
    name: property,
    message: `Please, confirm ${property} for this dataset:\n${data}`,
    default: () => {
      return defaultValue
    }
  }
  if (validation) {
    inquirerObj.validate = value => {
      const pass = value.match(validationPatterns[validation])
      if (pass) {
        return true
      }
      return `Provided value must match following pattern: ${validationPatterns[validation]}`
    }
  }
  return inquirerObj
}
