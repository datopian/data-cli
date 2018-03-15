#!/usr/bin/env node
// Native
const {resolve} = require('path')

// Packages
const ua = require('universal-analytics')

const {version} = require('../package.json')

// Ours
const {error} = require('../lib/utils/error')
const {handleError} = require('../lib/utils/error')
const updateNotifier = require('../lib/utils/update')

// Increase MaxListenersExceededWarning level for cases when the remote dataset has a lot of resources,
// to avoid: Warning: Possible EventEmitter memory leak detected. X end listeners added.
// ~11 requests is required to validate remote 1 tabular resource, so I set a limit to match a dataset with 10 files.
require('events').EventEmitter.defaultMaxListeners = 120;

// Handle all uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  handleError(err)
})

process.on('unhandledRejection', (err) => {
  handleError(err)
})

// Check and notify if any updates are available:
updateNotifier()

// Check if the current path exists and throw and error
// if the user is trying to deploy a non-existing path!
// This needs to be done exactly in this place, because
// the utility imports are taking advantage of it
try {
  process.cwd()
} catch (err) {
  if (err.code === 'ENOENT' && err.syscall === 'uv_cwd') {
    console.log(`Current path doesn't exist!`)
  } else {
    console.log(err)
  }
  process.exit(1)
}

const commands = new Set([
  'help',
  'get',
  'push',
  'push-flow',
  'validate',
  'info',
  'init',
  'cat',
  'login'
])

// Parse args and dispatch to relevant command
let args = process.argv.slice(2)

if (args[0] === '-v' || args[0] === '--version') {
  console.log(`${version}`)
  process.exit()
}

// Default command
let cmd = 'help'
const index = args.findIndex(a => commands.has(a))

if (index > -1) {
  cmd = args[index]
  args.splice(index, 1)

  // Dispatch to the underlying command and help will be called there
  if (cmd === 'help' && index < args.length && commands.has(args[index])) {
    cmd = args[index]
    args.splice(index, 1)
    args.unshift('--help')
  }
  if (cmd.includes(' ')) {
    const parts = cmd.split(' ')
    cmd = parts.shift()
    args = [].concat(parts, args)
  }
} else if (args[0] === '-h' || args[0] === '--help') {
  cmd = 'help'
} else if (args.length === 0) { // One final option is no command in which case show help
  cmd = 'help'
} else {
  error(`Command does not exist "` + args[0] + '"')
  console.error(`\nTo see a list of available commands run:`)
  console.error(`\n  data help\n`)
  process.exit(1)
}

const bin = resolve(__dirname, 'data-' + cmd + '.js')

// Track events using GA:
// Developers should set 'GA' env var so their usage doesn't get tracked:
const visitor = process.env.GA === 'data-dev-team' ? ua('UA-XXXX-XX') : ua('UA-80458846-4')
// Event category is 'cli', action is the command and label is all arguments:
visitor.event('cli', cmd, process.argv.slice(3, process.argv.length).toString()).send()

// Prepare process.argv for subcommand
process.argv = process.argv.slice(0, 2).concat(args)

// Load sub command
// With custom parameter to make "pkg" happy
require(bin, 'may-exclude')
