const fs = require('fs')
const path = require('path')

const {customMarked} = require('../lib/utils/tools.js')

const helpMarkdown = fs.readFileSync(path.join(__dirname, '../docs/help.md'), 'utf8')

console.log('\n' + customMarked(helpMarkdown))
