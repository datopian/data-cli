// Markdown
const marked = require('marked')
const TerminalRenderer = require('marked-terminal')
// ProgressBar
const ProgressBar = require('progress')
// Global packages
const globalPackages = require('global-packages')

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

const installedWithNPM = async () => {
  let packages

  try {
    packages = await globalPackages()
  } catch (err) {
    console.log(err)
    return false
  }

  if (!Array.isArray(packages)) {
    return false
  }

  const related = packages.find(item => item.name === 'now')

  if (!related || related.linked === true) {
    return false
  }

  if (related.linked === false) {
    return true
  }

  return false
}
module.exports.installedWithNPM = installedWithNPM
