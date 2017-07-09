const test = require('ava')

const { DataHub } = require('../lib/utils/datahub.js')

test('Can instantiate DataHub', t => {
  const apiUrl = 'https://apifix.datahub.io'
  const token = ''
  const datahub = new DataHub({apiUrl, token})
})

