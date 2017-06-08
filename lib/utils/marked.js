var marked = require('marked')
var TerminalRenderer = require('marked-terminal')

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
})

module.exports.customMarked = marked
