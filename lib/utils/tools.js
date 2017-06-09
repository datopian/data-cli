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
const bar = new ProgressBar(':token1 [:bar] :rate/bps :percent :etas', {
  complete: elephant + ' ',
  incomplete: ' ',
  width: 14,
  // needs to be defined. will be changed as needed when called
  total: 10
})
module.exports.bar = bar
