const stream = require('stream')

const toArray = require('stream-to-array')


const streamToString = async (strm) => {
  let out = await toArray(strm)
  out = out.join('')
  return out
}

const stringToStream = (str) => {
  const s  = new stream.Readable
  s.push(str)
  s.push(null)
  return s
}

module.exports = {
  streamToString: streamToString,
  stringToStream: stringToStream
}

