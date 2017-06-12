const { elephant } = require('./logo')

// markdown
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')
marked.setOptions({
  renderer: new TerminalRenderer()
})
module.exports.customMarked = marked

// spinner
const ora = require('ora')
const spinner = ora('Loading...')

module.exports.spinner = spinner

// ProgressBar
const ProgressBar = require('progress')
const bar = new ProgressBar(':download [:bar] :percent :etas', {
  complete: elephant + ' ',
  incomplete: ' ',
  width: 14,
  // needs to be defined. will be changed as needed when called
  total: 100
})
module.exports.bar = bar
