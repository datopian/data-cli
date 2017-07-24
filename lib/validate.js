const tv4 = require('tv4')
const fetch = require('node-fetch')

const {isUrl} = require('./utils/data')

export async function validate(descriptor) {
  try {
    await validateMetadata(descriptor)
    return true
  } catch (err) {
    return err
  }
}

export async function validateMetadata(descriptor) {
  // If descriptor has a profile property then use it
  // Else use the latest schema
  const defaultProfile = descriptor.profile || 'data-package'

  const profile = await Profile.load(defaultProfile)

  // Validate descriptor
  return profile.validate(descriptor)
}

// Profile class extracted from datapackage-js library
export class Profile {

  static async load(profile) {
    let jsonschema = _cache[profile]
    if (!jsonschema) {
      // Remote
      if (isUrl(profile)) {
        try {
          const response = await fetch(profile)
          jsonschema = await response.json()
        } catch (err) {
          throw new Error('Can not retrieve remote profile ' + profile)
        }

      // Local
      } else {
        try {
          const schemaPath = './schema/' + profile + '.json'
          jsonschema = require(schemaPath)
        } catch (err) {
          throw new Error('Profiles registry hasn\'t profile ' + profile)
        }
      }

      _cache[profile] = jsonschema
    }
    return new Profile(jsonschema)
  }

  get name() {
    if (this._jsonschema.title) {
      return this._jsonschema.title.replace(' ', '-').toLowerCase()
    }
    return null
  }

  get jsonschema() {
    return this._jsonschema
  }

  /**
   * Validate descriptor
   *
   */
  validate(descriptor) {
    const validation = tv4.validateMultiple(descriptor, this._jsonschema)
    if (!validation.valid) {
      const errors = []
      for (const error of validation.errors) {
        errors.push(new Error(
          `Descriptor validation error:
          ${error.message}
          at "${error.dataPath}" in descriptor and
          at "${error.schemaPath}" in profile`))
      }
      throw errors
    }
    return true
  }

  // Private

  constructor(jsonschema) {
    this._jsonschema = jsonschema
  }

}

// Internal

const _cache = {}
