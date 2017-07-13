// Test the CLI directly
const path = require('path')

const test = require('ava')
const { spawn } = require('cross-spawn')

const runcli = (...args) => {
  return new Promise((resolve, reject) => {
    const command = path.resolve(__dirname, '../bin/data.js')
    const data = spawn(command, args)

    let stdout = ''
    data.stdout.on('data', data => {
      stdout += data
    })

    data.on('error', err => {
      reject(err)
    })

    data.on('close', code => {
      resolve({
        code,
        stdout
      })
    })
  })
}


// Push

// bit pointless as a test but more elaborate testing requires
// a lot of mocking and we mock the core parts.
test('"data push -h --help" prints help message for push command', async t => {
  let result = await runcli('push', '-h')

  t.is(result.code, 0)
  let stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[1].includes('Push a Data Package to DataHub'))
})

// TODO: reinstate this once we figure out what does not work
test.skip('"data info core/co2-ppm" command prints out readme and resource list', async t => {
  const result = await runcli('info', 'test/fixtures/core/co2-ppm')
  t.is(result.code, 0)
  const stdout = result.stdout.split('\n')
  t.true(stdout.length > 1)
  t.true(stdout[5].includes('CO2 PPM'))
  t.true(stdout[17].includes('co2-annmean-mlo'))
})

