'use strict'

const routeSettingsParser = require('../route-settings-parser')
const attributeParser = require('../attribute-parser')
const exampleFormatter = require('../example-formatter')
const { reach } = require('hoek')
const lang = require('../language');

function flattenEntry (entry, options) {
  const endpoint = routeSettingsParser.parse(entry.settings)
  if(!options) {
    options = {
      lang: 'en'
    }
  }
  const validationTypes = {
    query: lang[options.lang ]['Query String'],
    params: lang[options.lang]['URI Components'],
    payload: lang[options.lang]['JSON Payload']
  }

  for (let validationType of Object.keys(validationTypes)) {
    if (entry.settings.validate[validationType]) {
      const validation = {
        humanName: validationTypes[validationType],
        elements: {}
      }

      attributeParser.parse(
        entry.settings.validate[validationType]._inner.children,
        null,
        validation.elements
      )

      validation.example = exampleFormatter(validationType, validation.elements, entry)
      endpoint.validation[validationType] = validation
    }
  }

  return endpoint
}

function flatten (table, options) {
  return table.reduce((routing, { public: plc }) => {
    const { settings, path, method } = plc

    const hidden = reach(settings, 'tags', { default: [] }).includes('private')
    if (hidden) {
      return routing
    }

    routing[path] = routing[path] || {}
    routing[path][method] = flattenEntry(plc, options)

    const pathValidation = reach(routing[path][method], 'validation.params')
    if (!pathValidation) {
      routing[path][method].validation.params = { example: path }
    }
    return routing
  }, {})
}

module.exports = {
  flatten,
  flattenEntry
}
