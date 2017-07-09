const { homedir } = require('os')
const { resolve: resolvePath } = require('path')
const EventEmitter = require('events')
const qs = require('querystring')
const { parse: parseUrl } = require('url')

const fetch = require('node-fetch')
const chalk = require('chalk')

const { Agent } = require('./agent')


export class DataHub extends EventEmitter {
  constructor({ apiUrl, token, debug = false }) {
    super()
    this._token = token
    this._debug = debug
    this._agent = new Agent(apiUrl, { debug })
  }

  close() {
    this._agent.close()
  }

  _fetch(_url, opts = {}) {
    opts.headers = opts.headers || {}
    return this._agent.fetch(_url, opts)
  }
}

