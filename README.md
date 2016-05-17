# base-pipeline [![NPM version](https://img.shields.io/npm/v/base-pipeline.svg?style=flat)](https://www.npmjs.com/package/base-pipeline) [![NPM downloads](https://img.shields.io/npm/dm/base-pipeline.svg?style=flat)](https://npmjs.org/package/base-pipeline) [![Build Status](https://img.shields.io/travis/node-base/base-pipeline.svg?style=flat)](https://travis-ci.org/node-base/base-pipeline)

base-methods plugin that adds pipeline and plugin methods for dynamically composing streaming plugin pipelines.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm install base-pipeline --save
```

## Usage

```js
var base = require('base-methods');
var pipeline = require('base-pipeline');
var bfs = require('base-fs');

// create your application and add the plugin
var app = base()
  .use(pipeline())
  .use(bfs)

// plugins may return a function
app.plugin('a', function() {
  return through.obj(function(file, enc, next) {
    next(null, file);
  });
});

// or a stream
app.plugin('b', through.obj(function(file, enc, next) {
  next(null, file);
}));

// use registered plugins
app.src(['foo/*.hbs'])
  .pipe(app.pipeline(['a', 'b']))
  .pipe(app.dest('site/'))
```

## Supported signatures

**Array of registered plugin names:**

```js
// register plugins
app.plugin('a', function() {});
app.plugin('b', function() {});

// pipeline
app.src(['foo/*.hbs'])
  .pipe(app.pipeline(['a', 'b']))
  .pipe(app.dest('site/'))
```

**List of registed plugin names:**

```js
// register plugins
app.plugin('a', function() {});
app.plugin('b', function() {});

// pipeline
app.src(['foo/*.hbs'])
  .pipe(app.pipeline('a', 'b'))
  .pipe(app.dest('site/'))
```

**Stacked:**

```js
// register plugins
app.plugin('a', function() {});
app.plugin('b', function() {});
app.plugin('c', function() {});

// pipeline
app.src(['foo/*.hbs'])
  .pipe(app.pipeline('a'))
  .pipe(app.pipeline('b'))
  .pipe(app.pipeline('c'))
  .pipe(app.dest('site/'))
```

**Functions that return a stream:**

```js
app.src(['foo/*.hbs'])
  .pipe(app.pipeline(function() {
    return through.obj(function(file, enc, next) {
      next(null, file);  
    })
  }))
  .pipe(app.pipeline(function() {
    return through.obj(function(file, enc, next) {
      next(null, file);  
    })
  }))
  .pipe(app.dest('site/'))
```

**Streams:**

In general, it's a best practice for plugins to return a function that returns a stream. This ensures that every time the function is called a new stream is returned.

```js
app.src(['foo/*.hbs'])
  .pipe(app.pipeline(through.obj(function(file, enc, next) {
    next(null, file);  
  }))
  .pipe(app.pipeline(through.obj(function(file, enc, next) {
    next(null, file);  
  }))
  .pipe(app.dest('site/'))
```

## Related projects

You might also be interested in these projects:

* [base-cli](https://www.npmjs.com/package/base-cli): Plugin for base-methods that maps built-in methods to CLI args (also supports methods from a… [more](https://www.npmjs.com/package/base-cli) | [homepage](https://github.com/node-base/base-cli)
* [base-config](https://www.npmjs.com/package/base-config): base-methods plugin that adds a `config` method for mapping declarative configuration values to other 'base'… [more](https://www.npmjs.com/package/base-config) | [homepage](https://github.com/node-base/base-config)
* [base-data](https://www.npmjs.com/package/base-data): adds a `data` method to base-methods. | [homepage](https://github.com/node-base/base-data)
* [base-methods](https://www.npmjs.com/package/base-methods): base-methods is the foundation for creating modular, unit testable and highly pluggable node.js applications, starting… [more](https://www.npmjs.com/package/base-methods) | [homepage](https://github.com/jonschlinkert/base-methods)
* [base-options](https://www.npmjs.com/package/base-options): Adds a few options methods to base-methods, like `option`, `enable` and `disable`. See the readme… [more](https://www.npmjs.com/package/base-options) | [homepage](https://github.com/jonschlinkert/base-options)
* [base-plugins](https://www.npmjs.com/package/base-plugins): Upgrade's plugin support in base applications to allow plugins to be called any time after… [more](https://www.npmjs.com/package/base-plugins) | [homepage](https://github.com/node-base/base-plugins)
* [base-store](https://www.npmjs.com/package/base-store): Plugin for getting and persisting config values with your base-methods application. Adds a 'store' object… [more](https://www.npmjs.com/package/base-store) | [homepage](https://github.com/node-base/base-store)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/node-base/base-pipeline/issues/new).

## Building docs

Generate readme and API documentation with [verb](https://github.com/verbose/verb):

```sh
$ npm install verb && npm run docs
```

Or, if [verb](https://github.com/verbose/verb) is installed globally:

```sh
$ verb
```

## Running tests

Install dev dependencies:

```sh
$ npm install -d && npm test
```

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2016, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT license](https://github.com/node-base/base-pipeline/blob/master/LICENSE).

***

_This file was generated by [verb](https://github.com/verbose/verb), v0.9.0, on May 17, 2016._