require("babel-core/register")
require("babel-polyfill")
const test = require('ava')
const {scanDir} = require('../lib/init.js')


test('checks filesAndDirs object', async t => {

  const res = await scanDir('test/fixtures/readdirTest/')
  console.log(res)
  const exp = { 
    files: 
     [ 'sample1.csv',
       'sample2.json' ],
    dirs: ['sampleDir'] 
  }
  t.deepEqual(res, exp)
})
