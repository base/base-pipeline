'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var through = require('through2');
var Base = require('base');
var option = require('base-option');
var fs = require('base-fs');
var pipeline = require('..');
var app;

describe('plugin()', function() {
  beforeEach(function() {
    app = new Base();
    app.isApp = true;
    app.use(fs());
    app.use(option());
    app.use(pipeline());
  });

  it('should throw an error when plugin name is invalid', function(cb) {
    try {
      app.plugin(null)
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert(err.message);
      assert(/to be a string/.test(err.message));
      cb();
    }
  });

  it('should expose a plugin method', function() {
    assert(app.plugin);
    assert.equal(typeof app.plugin, 'function');
  });

  it('should expose a plugins object', function() {
    assert(app.plugins);
    assert.equal(typeof app.plugins, 'object');
  });

  it('should register a plugin on `app.plugins`', function() {
    app.plugin('foo', function() {});
    assert(app.plugins.hasOwnProperty('foo'));
  });

  it('should get a registered plugin by key', function() {
    app.plugin('bar', function() {
      return through.obj(function() {
      });
    });
    var bar = app.plugin('bar');
    assert(bar);
    assert.equal(typeof bar, 'object');
    assert.equal(typeof bar.pipe, 'function');
  });

  it('should pass options when getting a plugin', function(cb) {
    app.plugin('bar', function(options) {
      return through.obj(function(file, enc, next) {
        file.options = options;
        next(null, file);
      });
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.plugin('bar', {one: 'two'}))
      .on('data', function(file) {
        assert.deepEqual(file.options, {one: 'two'});
      })
      .on('end', cb);
  });
});
