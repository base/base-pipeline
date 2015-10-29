'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var through = require('through2');
var base = require('base-methods');
var options = require('base-options');
var plugins = require('base-plugins');
var config = require('base-config');
var bfs = require('base-fs');
var pipeline = require('..');
var app;

function addName(name) {
  return function(options) {
    options = options || {};
    return through.obj(function (file, enc, cb) {
      var str = file.contents.toString()
      str += name;
      str += options.append || '';
      file.contents = new Buffer(str);
      this.push(file);
      cb();
    });
  };
}

describe('pipeline', function() {
  beforeEach(function () {
    app = base();
    app.use(bfs);
    app.use(plugins());
  });

  it('should throw an error when `app.option` is missing', function (cb) {
    try {
      app.use(pipeline());
      cb(new Error('expected an error'));
    } catch(err) {
      assert(err);
      assert(err.message);
      assert(/to be registered/.test(err.message));
      cb();
    }
  });

  it('should return a function when `isApp` is defined', function () {
    app.set('isApp', true);
    app.use(options());
    app.use(pipeline());

    var stream = app.pipeline();
    assert(app.fns);
    assert(Array.isArray(app.fns));
    assert(app.fns.length === 2);
  });

  it('should map "plugins" when app.config exists', function () {
    app.use(options());
    app.use(config());
    app.use(pipeline());
    assert(app.config.config.hasOwnProperty('plugins'));
  });

  it('should register plugin functions from config', function () {
    app.use(options());
    app.use(config());
    app.use(pipeline());
    var args = {
      plugins: {
        a: function() {},
        b: function() {},
        c: function() {},
      }
    };
    app.config.process(args);
    assert(app.plugins.hasOwnProperty('a'));
    assert(app.plugins.hasOwnProperty('b'));
    assert(app.plugins.hasOwnProperty('c'));
  });

  it('should register plugins from config paths', function () {
    app.use(options());
    app.use(config());
    app.use(pipeline());
    var args = {
      plugins: {
        a: 'test/fixtures/plugins/a.js',
        b: 'test/fixtures/plugins/b.js',
        c: 'test/fixtures/plugins/c.js',
      }
    };

    app.config.process(args);
    assert(app.plugins.hasOwnProperty('a'));
    assert(app.plugins.hasOwnProperty('b'));
    assert(app.plugins.hasOwnProperty('c'));

    assert(typeof app.plugins.a === 'function');
    assert(typeof app.plugins.b === 'function');
    assert(typeof app.plugins.c === 'function');
  });

  it('should register plugins with keys as paths', function () {
    app.use(options());
    app.use(config());
    app.use(pipeline());
    var args = {
      plugins: {
        'test/fixtures/plugins/a.js': {aaa: 'bbb'},
        'test/fixtures/plugins/b.js': {bbb: 'ccc'},
        'test/fixtures/plugins/c.js': {ddd: 'eee'}
      }
    };

    app.config.process(args);
    assert(app.plugins.hasOwnProperty('a'));
    assert(app.plugins.hasOwnProperty('b'));
    assert(app.plugins.hasOwnProperty('c'));

    assert(typeof app.plugins.a === 'function');
    assert(typeof app.plugins.b === 'function');
    assert(typeof app.plugins.c === 'function');
  });

  it('should throw an error when invalid config is used', function (cb) {
    app.use(options());
    app.use(config());
    app.use(pipeline());
    var args = {plugins: {'test/fixtures/plugins/a.js': null}};
    try {
      app.config.process(args);
      cb(new Error('expected an error'));
    } catch(err) {
      assert(err);
      assert(err.message);
      assert(/configuration/.test(err.message));
      cb();
    }
  });
});

describe('pipeline()', function() {
  beforeEach(function () {
    app = base();
    app.use(bfs);
    app.use(options());
    app.use(pipeline());
  });

  it('should expose a pipeline method', function () {
    assert(app.pipeline);
    assert(typeof app.pipeline === 'function');
  });

  it('should return a stream', function () {
    var stream = app.pipeline()
    assert(stream);
    assert(typeof stream === 'object');
    assert(typeof stream.on === 'function');
    assert(typeof stream.emit === 'function');
  });

  it('should compose a pipeline from a registered plugin', function (cb) {
    app.plugin('a', addName('a'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:a');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from a function', function (cb) {
    function addName(name) {
      return function() {
        return through.obj(function (file, enc, cb) {
          var str = file.contents.toString() + name;
          file.contents = new Buffer(str);
          this.push(file);
          cb();
        });
      };
    }

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(addName('foo')))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:foo');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from a stream', function (cb) {
    function addName(name) {
      return through.obj(function (file, enc, cb) {
        var str = file.contents.toString() + name;
        file.contents = new Buffer(str);
        this.push(file);
        cb();
      });
    }

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(addName('foo')))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:foo');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from an array of plugins', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should be chainable', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .pipe(app.pipeline('b'))
      .pipe(app.pipeline('c'))
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should be chainable with arrays', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b']))
      .pipe(app.pipeline('c'))
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should not blow up with empty pipelines', function (cb) {
    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:');
      })
      .on('end', cb);
  });

  it('should use all plugins when pipeline is empty', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should stack pipeline', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .pipe(app.pipeline())
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcabc');
      })
      .on('end', cb);
  });

  it('should take options', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline({append: 'foo'}))
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:afoobfoocfoo');
      })
      .on('end', cb);
  });

  it('should support plugins as a stream', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));
    app.plugin('d', through.obj(function (file, enc, next) {
      var str = file.contents.toString() + 'd';
      file.contents = new Buffer(str);
      next(null, file);
    }));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcd');
      })
      .on('end', cb);
  });

  it('should directly return streams passed to pipeline', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.pipeline(app.src('test/fixtures/foo.txt'))
      .pipe(app.pipeline())
      .pipe(app.pipeline())
      .on('data', function (file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcabc');
      })
      .on('end', cb);
  });

  it('should do nothing when plugin is invalid', function (cb) {
    app.plugin('foo', null);

    app.pipeline(app.src('test/fixtures/foo.txt'))
      .pipe(app.pipeline())
      .on('end', function (err) {
        cb();
      });
  });

  it('should use plugin options define on `app.options`', function (cb) {
    app.plugin('a', function(options) {
      options = options || {};
      return through.obj(function (file, enc, cb) {
        var str = file.contents.toString() + options.foo;
        file.contents = new Buffer(str);
        this.push(file);
        cb();
      });
    });

    app.option('plugin.a', {
      foo: 'bar'
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:bar');
      })
      .on('end', cb);
  });

  it('should disable a plugin', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.disable('plugin.a');

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:bc');
      })
      .on('end', cb);
  });

  it('should disable a plugin on options', function (cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.option('plugin.a', {
      disable: true
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function (file) {
        assert(file.contents.toString() === 'Name:bc');
      })
      .on('end', cb);
  });
});
