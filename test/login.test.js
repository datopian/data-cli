const test = require('ava')
const nock = require('nock')
const sinon = require('sinon')
const fs = require('fs')

const login = require('../lib/login')
const config = require('../config')

test.before(t => {
  nock(config.get('api'))
    .persist()
    .get(`/auth/check?jwt=&next=http://localhost:3000`)
    .reply(200, {
      authenticated: false,
      providers: {
        github: true,
        google: true
      }
    })
    .get(`/auth/check?jwt=1a2b3c4d&next=http://localhost:3000`)
    .reply(200, {
      authenticated: true,
      profile: {
        email: 'actual_email@gmail.com',
        name: 'Firstname Secondname'
      }
    })
})

test('extracts token', t => {
  let url = 'http://localhost:3000/?jwt=abc'
  let token = login._extractToken(url)
  t.is(token, 'abc')
})

test('Authenticate function returns urls for login - GitHub and Google', async (t) => {
  const res = await login.authenticate('') // Without jwt so we get urls for login
  t.is(res.authenticated, false)
  t.true(res.providers.github)
  t.true(res.providers.google)
})

test('Authenticates with GOOGLE using given jwt and returns user info', async (t) => {
  const jwt = '1a2b3c4d'
  const res = await login.authenticate(jwt)
  t.is(res.authenticated, true)
  t.is(res.profile.email, 'actual_email@gmail.com')
  t.is(res.profile.name, 'Firstname Secondname')
})

