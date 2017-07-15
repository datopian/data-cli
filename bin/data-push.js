#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const inquirer = require('inquirer')
const hri = require('human-readable-ids').hri

// ours
const config = require('../lib/utils/config')
const { customMarked } = require('../lib/utils/tools.js')
const { handleError, error } = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const { DataHub } = require('../lib/utils/datahub.js')
const { Package, Resource } = require('../lib/utils/data.js')


const argv = minimist(process.argv.slice(2), {
  string: ['push'],
  boolean: ['help', 'debug'],
  alias: { help: 'h' }
})

var pushMarkdown = fs.readFileSync(path.join(__dirname, '../docs/push.md'),'utf8')
const help = () => {
  console.log('\n'+ customMarked(pushMarkdown))
}

if (argv.help) {
  help()
  process.exit(0)
}

Promise.resolve().then(async () => {
  let stopSpinner = () => {}
  try {
    const filePath = argv._[0]
    let pkg
    if (fs.lstatSync(filePath).isFile()) {
      pkg = await preparePackageFromFile(filePath)
    } else {
      pkg = await Package.load(filePath)
    }

    stopSpinner = wait('Commencing push ...')

    const datahub = new DataHub({
      apiUrl: config.get('api'),
      token: config.get('token'),
      debug: argv.debug,
      owner: config.get('profile').id
    })
    await datahub.push(pkg)

    stopSpinner()
    const message = '🙌  your data is published!\n'
    const url = '🔗  ' + urljoin(config.get('domain'), config.get('profile').id, pkg.descriptor.name)
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

const preparePackageFromFile = async (filePath) => {
  const resource = Resource.load(filePath)
  await resource.addSchema
  const headers = resource.descriptor.schema.fields.map(field => field.name)
  const fieldTypes = resource.descriptor.schema.fields.map(field => field.type)
  // prompt user with headers and fieldTypes
  const questions = [ask('headers', headers), ask('types', fieldTypes)]
  const answers = await inquirer.prompt(questions)
  if (answers.headers === 'y' & answers.types === 'y') {
    // remove path stuff
    let dpName = filePath.replace(/^.*[\\\/]/, '')
    const extension = path.extname(dpName)
    // remove ext
    dpName = dpName.replace(extension, '').replace(/\s+/g, '-').toLowerCase()
    // add human readable id
    dpName += '-' + hri.random()
    const metadata = {
      name: dpName,
      resources: [resource.descriptor],
      path: 'datapackage.json',
      data: {
        name: dpName
      }
    }
    const pkg = await Package.load(metadata)
    return pkg
  } else {
    // Maybe nicer exit - user has chosen not to proceed for now ...
    throw Error('Please, generate datapackage.json and push.')
  }
}

const ask = (name, data) => {
  return {
    type: 'input',
    name: name,
    message: `Are these ${name} correct for this dataset:\n[${data}]\ny/n?`,
    default: () => {
      return 'y'
    },
    validate: (value) => {
      const pass = value.match(/^[y,n]+$/)
      if (pass) {
        return true
      }
      return `Please, provide with following responses 'y' for yes or 'n' for no`
    }
  }
}

