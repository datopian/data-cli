const prompt = require('prompt')
const { logger } = require('./log-handler.js')

/*
 * function to prompt to user
 * @param {Schema} as schema per prompt lib documentation
 * @return {Object} result of user prompt(e.g: name can be accessed by result.name)
 */
const promptFunction = (schema) => {
  prompt.message = ''
  prompt.start()
  return new Promise((resolve, reject) => {
    prompt.get(schema, (err, result) => {
      if (err) {
        reject(err)
        logger(err.message+'\n', 'abort', true)
      }
      resolve(result)
    })
  })
}

module.exports.promptFunction = promptFunction
