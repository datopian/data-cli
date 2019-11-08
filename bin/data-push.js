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
const {DataHub, Validator, authenticate, config, Agent} = require('datahub-client')
const ua = require('universal-analytics')
const ProgressBar = require('progress')

// Ours
const {customMarked} = require('../lib/utils/tools.js')
const {error, handleError} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const info = require('../lib/utils/output/info.js')


const argv = minimist(process.argv.slice(2), {
  string: ['push', 'sheets'],
  boolean: ['help', 'test', 'debug', 'interactive', 'unlisted', 'private', 'zip', 'sqlite'],
  alias: {help: 'h', interactive: 'i', sheets: 'sheet'}
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
  let out = {authenticated: true}
  if (!argv.test) {
    try {
      out = await authenticate(apiUrl, token)
    } catch (err) {
      await handleError(err)
      process.exit(1)
    }
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
      try {
        dataset = await Dataset.load(filePath)
      } catch(err){
        info("You can run:")
        info("'data validate' to check your data.")
        info("'data init' to create a datapackage.")
        info("'data help push' to get more info.")
        await handleError(err)
        process.exit(1)
      }
    } else {
      dataset = await prepareDatasetFromFile(filePath)
    }

    dataset.resources.forEach(resource => {
      if (resource.constructor.name === 'FileInline') {
        throw new Error('We do not support dataset with inlined data')
      }
    })

    stopSpinner = wait('Commencing push ...')

    const datahubConfigs = {
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile') ? config.get('profile').id : config.get('id'),
      owner: config.get('profile') ? config.get('profile').username : config.get('username')
    }
    let findability = 'published'
    if (argv.unlisted) {
      findability = 'unlisted'
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

    // Validate metadata prior to pushing:
    // Let's normalize resource names as it is common when they're capitalized
    // or have spaces - they're generated from file names:
    for (const idx in dataset.descriptor.resources) {
      if (!dataset.descriptor.resources[idx].name.match(validationPatterns['nameValidation'])) {
        dataset.descriptor.resources[idx].name = dataset.descriptor.resources[idx].name.replace(/\s+/g, '-').toLowerCase()
        dataset.resources[idx].descriptor.name = dataset.resources[idx].descriptor.name.replace(/\s+/g, '-').toLowerCase()
      }
    }
    const validator = new Validator()
    await validator.validateMetadata(dataset.descriptor)
    stopSpinner()
    // Show the progress bars for each file being uploaded:
    const progressBars = []
    // Listen for 'upload' events being emited from the DataHub class:
    datahub.on('upload', (message) => {
      // Check if a bar is already initiated:
      const barItem = progressBars.find(item => item.file === message.file)
      if (barItem) {
        try {
          if (message.completed) {
            if (process.platform !== 'win32') {
              barItem.bar.interrupt('Completed: ' + message.file)
            } else {
              info('Completed: ' + message.file)
            }
          } else {
            barItem.bar.tick(message.chunk.length)
          }
        } catch (err) {
          info(err.message)
        }
      } else { // If a bar doesn't exist initiate one:
        progressBars.push({
          file: message.file,
          bar: new ProgressBar(`  Uploading [:bar] :percent (:etas left)   ${message.file}`, {
            complete: '*',
            incomplete: ' ',
            width: 30,
            total: message.total,
            clear: process.platform === 'win32' ? false : true
          })
        })
      }
    })

    const res = await datahub.push(dataset, options)
    // Analytics:
    if (process.env.datahub !== 'dev') {
      const visitor = ua('UA-80458846-4')
      visitor.set('uid', datahubConfigs.ownerid)
      // Check if it's the first push:
      const agent = new Agent(datahubConfigs.apiUrl, {debug: argv.debug})
      let response = await agent.fetch(
        `/metastore/search/events?owner="${datahubConfigs.owner}"&size=0`,
        {headers: {'Auth-Token': token}}
      )
      if (response.ok) {
        response = await response.json()
        if (response.summary && response.summary.total === 0) { // It's the first push
          visitor.event('cli', 'push-first').send()
        }
        // Count sucessful pushes:
        visitor.event('cli', 'push-success').send()
      }
    }
    // Print success message and provide URL to showcase page:
    let revisionId = res.flow_id.split('/').pop()
    const message = '\n🙌  your data is published!\n'
    const url = urljoin(config.get('domain'), datahubConfigs.owner, dataset.descriptor.name, 'v', revisionId)
    let copied = ' (copied to clipboard)'
    try {
      await copyToClipboard(url)
    } catch (err) {
      copied = ''
      console.log(`Warning: Failed to copy to clipboard - ${err.message}`)
    }
    console.log(message + '🔗  ' + url + copied)
  } catch (err) {
    stopSpinner()
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    await handleError(err)
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
    try {
      await file.addSchema()
    } catch(err){
      error("tabular file is invalid: " + file.path)
      error(err.message)
      if (argv.debug){
        console.log('> [debug]\n' + err.stack)
      }
      process.exit(1)
    }

    if (argv.interactive) {
      // Prompt user with headers and fieldTypes
      const headers = file.descriptor.schema.fields.map(field => field.name)
      const fieldTypes = file.descriptor.schema.fields.map(field => field.type)
      const questions = [
        ask('headers', headers, 'y', 'yesOrNo'),
        ask('types', fieldTypes, 'y', 'yesOrNo')
      ]
      const answers = await inquirer.prompt(questions)

      if (answers.headers === 'n' || answers.types === 'n') {
        // Maybe nicer exit - user has chosen not to proceed for now ...
        throw new Error('Please, generate datapackage.json (you can use "data init") and push.')
      }
    }
  }

  let dpName, dpTitle
  if (argv.name) { // If name is provided in args then no user prompting:
    dpName = argv.name.toString()
    // Make unslugifies version for title:
    dpTitle = dpName.replace(/-+/g, ' ')
    dpTitle = dpTitle.charAt(0).toUpperCase() + dpTitle.slice(1)
  } else {
    dpName = file.descriptor.name.replace(/\s+/g, '-').toLowerCase()
    // Add human readable id so that this packge does not conflict with other
    // packages (name is coming from the file name which could just be
    // data.csv)
    dpName += '-' + hri.random()
    // Confirm dpName with user:
    let answer = await inquirer.prompt([ask('name', dpName, dpName, 'nameValidation')])
    dpName = answer.name
    // Make unslugifies version for title:
    dpTitle = dpName.replace(/-+/g, ' ')
    dpTitle = dpTitle.charAt(0).toUpperCase() + dpTitle.slice(1)
    // Confirm title with user:
    answer = await inquirer.prompt([ask('title', dpTitle, dpTitle)])
    dpTitle = answer.title
  }

  const metadata = {
    name: dpName,
    title: dpTitle,
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
