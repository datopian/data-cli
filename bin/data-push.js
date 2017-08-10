#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const inquirer = require('inquirer')
const hri = require('human-readable-ids').hri

// Ours
const config = require('../lib/utils/config')
const {customMarked} = require('../lib/utils/tools.js')
const {handleError} = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const {DataHub} = require('../lib/utils/datahub.js')
const {Dataset, File} = require('../lib/utils/data.js')

const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help', 'debug'],
  alias: {help: 'h'}
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
  try {
    const filePath = argv._[0] || process.cwd()
    let pkg
    if (fs.lstatSync(filePath).isFile()) {
      pkg = await preparePackageFromFile(filePath)
    } else {
      pkg = await Dataset.load(filePath)
    }

    stopSpinner = wait('Commencing push ...')

    const datahub = new DataHub({
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      ownerid: config.get('profile').id,
      owner: config.get('profile').username
    })
    await datahub.push(pkg)

    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = '🔗  ' + urljoin(config.get('domain'), config.get('profile').username, pkg.descriptor.name)
    console.log(message + url)
  } catch (err) {
    stopSpinner()
    handleError(err)
    if (argv.debug) {
      console.log('> [debug]\n' + err.stack)
    }
    process.exit(1)
  }
})

const preparePackageFromFile = async filePath => {
  const pathParts = path.parse(filePath)
  const resource = File.load(pathParts.base, {basePath: pathParts.dir})

  await resource.addSchema
  const headers = resource.descriptor.schema.fields.map(field => field.name)
  const fieldTypes = resource.descriptor.schema.fields.map(field => field.type)
  // Prompt user with headers and fieldTypes
  const questions = [ask('headers', headers), ask('types', fieldTypes)]
  const answers = await inquirer.prompt(questions)

  if (answers.headers === 'n' & answers.types === 'n') {
    // Maybe nicer exit - user has chosen not to proceed for now ...
    throw new Error('Please, generate datapackage.json and push.')
  }

  let dpName = pathParts.name.replace(/\s+/g, '-').toLowerCase()
  // Add human readable id so that this packge does not conflict with other
  // packages (name is coming from the resource file name which could just be
  // data.csv)
  dpName += '-' + hri.random()
  const metadata = {
    name: dpName,
    title: '', // TODO: generate from file name (maybe prompt user for it ...)
    resources: []
  }
  const pkg = await Dataset.load(metadata)
  pkg.addResource(resource)
  return pkg
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
