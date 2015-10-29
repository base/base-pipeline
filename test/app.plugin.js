'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var base = require('base-methods');
var options = require('base-options');
var bfs = require('base-fs');
var pipeline = require('..');
var app;

describe('plugin()', function() {
  beforeEach(function () {
    app = base();
    app.use(bfs);
    app.use(options());
    app.use(pipeline());
  });

  it('should throw an error when plugin name is invalid', function (cb) {
    try {
      app.plugin(null)
      cb(new Error('expected an error'));
    } catch(err) {
      assert(err);
      assert(err.message);
      assert(/to be a string/.test(err.message));
      cb();
    }
  });

  it('should expose a plugin method', function () {
    assert(app.plugin);
    assert(typeof app.plugin === 'function');
  });

  it('should expose a plugins object', function () {
    assert(app.plugins);
    assert(typeof app.plugins === 'object');
  });

  it('should register a plugin on `app.plugins`', function () {
    app.plugin('foo', function () {});
    assert(app.plugins.hasOwnProperty('foo'));
  });

  it('should get a registered plugin by key', function () {
    app.plugin('bar', function () {});
    var bar = app.plugin('bar');
    assert(bar);
    assert(typeof bar === 'function');
  });
});
