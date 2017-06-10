const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const {customMarked} = require('../lib/utils/tools.js')

const { box, elephant, square } = require('../lib/utils/logo')

const dhStyle = chalk.bold.underline
const italic = chalk.italic
const boldText = chalk.bold
const underline = chalk.underline

var helpMarkdown = fs.readFileSync(path.join(__dirname, '../docs/help.md'),'utf8')

console.log('\n'+ customMarked(helpMarkdown))
