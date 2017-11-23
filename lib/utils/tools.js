// Markdown
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')
// ProgressBar
const ProgressBar = require('progress')

const {elephant} = require('./logo')

marked.setOptions({
  renderer: new TerminalRenderer()
})
module.exports.customMarked = marked

const bar = new ProgressBar(':download [:bar] :percent :etas', {
  complete: elephant + ' ',
  incomplete: ' ',
  width: 14,
  // Needs to be defined. will be changed as needed when called
  total: 100
})
module.exports.bar = bar
