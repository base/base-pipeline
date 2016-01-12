'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var through = require('through2');
var base = require('base');
var options = require('base-options');
var plugins = require('base-plugins');
var config = require('base-config');
var fs = require('base-fs');
var pipeline = require('..');
var app;

function addName(name) {
  return function(options) {
    options = options || {};
    return through.obj(function(file, enc, cb) {
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
  beforeEach(function() {
    app = base();
    app.use(fs);
    app.use(plugins());
  });

  it('should throw an error when `app.option` is missing', function(cb) {
    try {
      app.use(pipeline());
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert(err.message);
      assert(/to be registered/.test(err.message));
      cb();
    }
  });

  it('should return a function when `isApp` is defined', function() {
    app.set('isApp', true);
    app.use(options());
    app.use(pipeline());

    var stream = app.pipeline();
    assert(app.fns);
    assert(Array.isArray(app.fns));
    assert(app.fns.length === 2);
  });
});

describe('pipeline()', function() {
  beforeEach(function() {
    app = base();
    app.use(fs);
    app.use(options());
    app.use(pipeline());
  });

  it('should expose a pipeline method', function() {
    assert(app.pipeline);
    assert(typeof app.pipeline === 'function');
  });

  it('should return a stream', function() {
    var stream = app.pipeline()
    assert(stream);
    assert(typeof stream === 'object');
    assert(typeof stream.on === 'function');
    assert(typeof stream.emit === 'function');
  });

  it('should compose a pipeline from a registered plugin', function(cb) {
    app.plugin('a', addName('a'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:a');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from a function', function(cb) {
    function addName(name) {
      return function() {
        return through.obj(function(file, enc, cb) {
          var str = file.contents.toString() + name;
          file.contents = new Buffer(str);
          this.push(file);
          cb();
        });
      };
    }

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(addName('foo')))
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:foo');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from a stream', function(cb) {
    function addName(name) {
      return through.obj(function(file, enc, cb) {
        var str = file.contents.toString() + name;
        file.contents = new Buffer(str);
        this.push(file);
        cb();
      });
    }

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(addName('foo')))
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:foo');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from an array of plugins', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from an array of plugins', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a', 'b', 'c'))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should compose a pipeline from a mixture of string/array', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b'], 'c'))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should recognize options as the last argument', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b'], 'c', {append: '_'}))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:a_b_c_');
      })
      .on('end', cb);
  });

  it('should be chainable', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .pipe(app.pipeline('b'))
      .pipe(app.pipeline('c'))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should be chainable with arrays', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b']))
      .pipe(app.pipeline('c'))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should not blow up with empty pipelines', function(cb) {
    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:');
      })
      .on('end', cb);
  });

  it('should use all plugins when pipeline is empty', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abc');
      })
      .on('end', cb);
  });

  it('should stack pipeline', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcabc');
      })
      .on('end', cb);
  });

  it('should take options', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline({append: 'foo'}))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:afoobfoocfoo');
      })
      .on('end', cb);
  });

  it('should support plugins as a stream', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));
    app.plugin('d', through.obj(function(file, enc, next) {
      var str = file.contents.toString() + 'd';
      file.contents = new Buffer(str);
      next(null, file);
    }));

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcd');
      })
      .on('end', cb);
  });

  it('should directly return streams passed to pipeline', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.pipeline(app.src('test/fixtures/foo.txt'))
      .pipe(app.pipeline())
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.contents.toString() === 'Name:abcabc');
      })
      .on('end', cb);
  });

  it('should expose "stream" to plugins', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.foo = 'bar';
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.foo === 'bar');
      })
      .on('end', cb);
  });

  it('should work with a named plugin', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.foo = 'bar';
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a'))
      .on('data', function(file) {
        assert(file.foo === 'bar');
      })
      .on('end', cb);
  });

  it('should expose "options" to plugins', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.foo = options.foo;
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline({foo: 'bar'}))
      .on('data', function(file) {
        assert(file.contents.toString());
        assert(file.foo === 'bar');
      })
      .on('end', cb);
  });

  it('should handle multiple plugins that pipe from stream', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.a = 'aaa';
        next(null, file);
      }));
    });
    app.plugin('b', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.b = 'bbb';
        next(null, file);
      }));
    });
    app.plugin('c', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.c = 'ccc';
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.a === 'aaa');
        assert(file.b === 'bbb');
        assert(file.c === 'ccc');
      })
      .on('end', cb);
  });

  it('should handle multiple named plugins that pipe from stream', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.a = 'aaa';
        next(null, file);
      }));
    });
    app.plugin('b', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.b = 'bbb';
        next(null, file);
      }));
    });
    app.plugin('c', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.c = 'ccc';
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline('a', 'c'))
      .on('data', function(file) {
        assert(file.a === 'aaa');
        assert(!file.b);
        assert(file.c === 'ccc');
      })
      .on('end', cb);
  });

  it('should disable plugins', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.a = 'aaa';
        next(null, file);
      }));
    });
    app.plugin('b', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.b = 'bbb';
        next(null, file);
      }));
    });
    app.plugin('c', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        file.c = 'ccc';
        next(null, file);
      }));
    });

    app.disable('plugin.b');

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('data', function(file) {
        assert(file.a === 'aaa');
        assert(!file.b);
        assert(file.c === 'ccc');
      })
      .on('end', cb);
  });

  it('should handle multiple plugins that pipe from stream', function(cb) {
    app.plugin('a', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        var str = file.contents.toString() + 'aaa';
        file.contents = new Buffer(str);
        next(null, file);
      }));
    });
    app.plugin('b', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        var str = file.contents.toString() + 'bbb';
        file.contents = new Buffer(str);
        next(null, file);
      }));
    });
    app.plugin('c', function(options, stream) {
      return stream.pipe(through.obj(function(file, enc, next) {
        var str = file.contents.toString() + 'ccc';
        file.contents = new Buffer(str);
        next(null, file);
      }));
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['c', 'a', 'b']))
      .on('data', function(file) {
        assert.equal(file.contents.toString(), 'Name:cccaaabbb');
      })
      .on('end', cb);
  });

  it('should do nothing when plugin is invalid', function(cb) {
    app.plugin('foo', null);

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline())
      .on('end', function(err) {
        cb();
      });
  });

  it('should use plugin options define on `app.options`', function(cb) {
    app.plugin('a', function(options) {
      options = options || {};
      return through.obj(function(file, enc, cb) {
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
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:bar');
      })
      .on('end', cb);
  });

  it('should disable a plugin', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.disable('plugin.a');

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:bc');
      })
      .on('end', cb);
  });

  it('should disable a plugin on options', function(cb) {
    app.plugin('a', addName('a'));
    app.plugin('b', addName('b'));
    app.plugin('c', addName('c'));

    app.option('plugin.a', {
      disable: true
    });

    app.src('test/fixtures/foo.txt')
      .pipe(app.pipeline(['a', 'b', 'c']))
      .on('data', function(file) {
        assert(file.contents.toString() === 'Name:bc');
      })
      .on('end', cb);
  });
});
