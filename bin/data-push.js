#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')
const urljoin = require('url-join')
const inquirer = require('inquirer')

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

Promise.resolve().then(async () => {
  let stopSpinner = () => {}
  try {
    stopSpinner = wait('Loading data ...')
    const filePath = argv._[0]
    let pkg
    if (fs.lstatSync(filePath).isFile()) {
      const resource = Resource.load(filePath)
      await resource.addSchema
      const headers = resource.descriptor.schema.fields.map(field => field.name)
      const fieldTypes = resource.descriptor.schema.fields.map(field => field.type)
      stopSpinner()
      // prompt user with headers and fieldTypes
      const questions = [ask('headers', headers), ask('types', fieldTypes)]
      const answers = await inquirer.prompt(questions)
      stopSpinner = wait('Commencing push ...')
      if (answers.headers === 'y' & answers.types === 'y') {
        const metadata = {
          name: 'test',
          resources: [resource.descriptor]
        }
        pkg = await Package.load(metadata)
      } else {
        throw Error('Please, generate datapackage.json and push.')
      }
    } else {
      pkg = await Package.load(filePath)
    }

    stopSpinner()
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
