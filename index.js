'use strict';

var path = require('path');
var utils = require('./utils');

module.exports = function(options) {
  return function fn(app) {
    plugin(options).call(this, app);
    if (this.isApp) {
      return fn;
    }
  };
};

function plugin(options) {
  return function(app) {
    if (typeof app.option !== 'function') {
      throw new Error('"base-pipeline" plugin expects '
        + 'the "base-options" plugin to be registered first.');
    }

    this.plugins = this.plugins || {};

    /**
     * Register a plugin by `name`
     *
     * @param  {String} `name`
     * @param  {Function} `fn`
     * @api public
     */

    this.define('plugin', function(name, opts, fn) {
      if (typeof name !== 'string') {
        throw new TypeError('expected plugin name to be a string');
      }
      if (arguments.length === 1) {
        return this.plugins[name];
      }
      if (typeof opts === 'function' || isStream(opts)) {
        fn = opts;
        opts = {};
      }
      this.option(['plugin', name], opts);
      this.plugins[name] = fn;
      return this;
    });

    /**
     * Create a plugin pipeline from an array of plugins.
     *
     * @param  {Array} `plugins` Each plugin is a function that returns a stream,
     *                       or the name of a registered plugin.
     * @param  {Object} `options`
     * @return {Stream}
     * @api public
     */

    this.define('pipeline', function(plugins, options) {
      if (isStream(plugins)) return plugins;

      if (isPlugins(plugins)) {
        plugins = [].concat.apply([], [].slice.call(arguments));
        if (utils.typeOf(plugins[plugins.length - 1]) === 'object') {
          options = plugins.pop();
        } else {
          options = {};
        }
      }

      if (utils.typeOf(plugins) === 'object') {
        options = plugins;
        plugins = null;
      }

      if (!plugins) {
        plugins = Object.keys(this.plugins);
      }

      var len = plugins.length, i = -1;
      var res = [];

      var pass = utils.through.obj();
      pass.resume();
      res.push(pass);

      while (++i < len) {
        var plugin = utils.through.obj();
        plugin = normalize(this, plugins[i], options, plugin);
        if (!plugin) continue;
        res.push(plugin);
      }

      var stream = utils.combine(res);
      stream.on('error', this.emit.bind(this, 'error'));
      return stream;
    });

    /**
     * Register `plugins` with `app.config` if it exists.
     * (app.config is added via the base-config plugin)
     */

    if (typeof this.config === 'function' && this.config.map) {
      this.config.map('plugins', function(plugins) {
        for (var key in plugins) {
          var name = path.basename(key, path.extname(key));
          var val = plugins[key];
          var fn;

          if (typeof val === 'function') {
            this.plugin(name, {}, val);

          } else if (typeof val === 'string') {
            fn = require(path.resolve(val));
            this.plugin(name, {}, fn);

          } else if (val && typeof val === 'object') {
            fn = require(path.resolve(key));
            this.plugin(name, val, fn);

          } else {
            var args = JSON.stringify([].slice.call(arguments));
            throw new Error('plugins configuration is not supported: ' + args);
          }
        }
      });
    }
  };
}

var isDisabled = disabled('plugin');

function normalize(app, val, options, stream) {
  if (typeof val === 'string' && app.plugins.hasOwnProperty(val)) {
    if (isDisabled(app, val)) return null;
    var name = path.basename(val, path.extname(val));
    var opts = utils.extend({}, app.option(['plugin', name]), options);
    return normalize(app, app.plugins[val], opts, stream);
  }
  if (typeof val === 'function') {
    return val.call(app, options, stream);
  }
  if (isStream(val)) {
    return val;
  }
  return null;
}

/**
 * Returns true if the plugin is disabled.
 */

function disabled(key) {
  return function(app, prop) {
    // key + '.plugin'
    if (app.isFalse([key, prop])) {
      return true;
    }
    // key + '.plugin.disable'
    if (app.isTrue([key, prop, 'disable'])) {
      return true;
    }
    return false;
  };
}

function isStream(val) {
  return val && typeof val === 'object'
    && typeof val.pipe === 'function';
}

function isPlugins(val) {
  return Array.isArray(val)
    || typeof val === 'function'
    || typeof val === 'string';
}

