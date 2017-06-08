const test = require('ava')
const chalk = require('chalk')
const { logger } = require('../lib/utils/log-handler.js')
const sinon = require('sinon')


test.beforeEach(t => {
  t.context.error = console.error
  t.context.log = console.log
  console.error = sinon.spy()
  console.log = sinon.spy()
})

test.afterEach(t => {
  console.error.reset()
  console.log.reset()
  console.error = t.context.error
  console.log = t.context.log
})

test.serial('Error log is working fine', t => {
  logger('error message', 'error')
  const exp = `${chalk.bold.red('Error:')} error message`
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes(exp))
})

test.serial('Warning log is working fine', t => {
  logger('warning message', 'warning')
  const exp = `${chalk.bold.yellow('Warning:')} warning message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})

test.serial('Aborting log is working fine', t => {
  logger('aborting message', 'abort')
  const exp = `${chalk.bold.yellow('Aborting:')} aborting message`
  t.true(console.error.calledOnce)
  t.true(console.error.firstCall.args[0].includes(exp))
})


test.serial('Success log is working fine', t => {
  logger('Success message', 'success')
  const exp = `${chalk.bold.green('Success:')} Success message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})

test.serial('defailt log is working fine', t => {
  logger('Success message')
  const exp = `${chalk.bold.green('Success:')} Success message`
  t.true(console.log.calledOnce)
  t.true(console.log.firstCall.args[0].includes(exp))
})
