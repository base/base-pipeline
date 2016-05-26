'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Utils
 */

require('base-option', 'option');
require('extend-shallow', 'extend');
require('is-registered');
require('is-valid-instance');
require('kind-of', 'typeOf');
require('stream-combiner', 'combine');
require('through2', 'through');
require = fn;

/**
 * Returns true if the given instance is valid
 */

utils.isValid = function isValid(app) {
  if (!utils.isValidInstance(app, ['app', 'views', 'collection'])) {
    return false;
  }
  if (utils.isRegistered(app, 'base-pipeline')) {
    return false;
  }
  return true;
};

/**
 * Expose `utils` modules
 */

module.exports = utils;
