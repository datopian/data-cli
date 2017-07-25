const parse = require('csv-parse')

export const csvParser = async resource => {
  const stream = await resource.stream()
  return stream.pipe(parse())
}
