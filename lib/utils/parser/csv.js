const parse = require('csv-parse')

export const csvParser = async (resource, keyed = false) => {
  const stream = await resource.stream()
  const columns = keyed ? true : null
  return stream.pipe(parse({columns}))
}
