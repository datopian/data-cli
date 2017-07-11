#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const minimist = require('minimist')

// ours
const config = require('../lib/utils/config')
const { customMarked } = require('../lib/utils/tools.js')
const { handleError, error } = require('../lib/utils/error')
const wait = require('../lib/utils/output/wait')
const { DataHub } = require('../lib/utils/datahub.js')
const { Package } = require('../lib/utils/data.js')


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
  const stopSpinner = wait('Preparing...')
  try {
    const filePath = argv._[0]
    var pkg = new Package(filePath)
    await pkg.load()

    const datahub = new DataHub({apiUrl: config.get('api'), token: config.get('token'), debug: argv.debug})
    var out = await datahub.push(pkg)

    const message = '🙌  your data is published!\n'
    const url = '🔗  ' + urljoin(config.get('domain'), config.get('username'), pkg.descriptor.name)
    stopSpinner()
    console.log(message + url)
  } catch (err) {
    stopSpinner()
    handleError(err)
    process.exit(1)
  }
})
