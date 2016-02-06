'use strict';

var through = require('through2');
var mocha = require('gulp-mocha');
var stylish = require('jshint-stylish');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var Composer = require('composer');

var fs = require('base-fs');
var option = require('base-option');
var base = require('base');

var composer = new Composer();
var pipeline = require('./');

var app = base()
  .use(fs())
  .use(option())
  .use(pipeline());


var lint = ['index.js', 'utils.js', 'lib/*.js', 'test/*.js'];

app.plugin('lint', function(options, stream) {
  return stream
    .on('data', console.log)
    .on('error', console.log)
    .pipe(jshint(options))
    .on('error', console.log)
    .pipe(jshint.reporter(stylish))
});

app.plugin('coverage', function(options, stream) {
  stream
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

app.plugin('mocha', function(options, stream) {
  return stream.pipe(mocha())
    .pipe(istanbul.writeReports())
    .pipe(istanbul.writeReports({
      reporters: [ 'text' ],
      reportOpts: options
    }))
});

composer.task('lint', function(cb) {
  app.src(lint.concat('test/*.js'))
    .pipe(app.pipeline('lint'))
    .on('data', function(file) {
      console.log(file)
    })
    .on('end', cb);
});

composer.task('coverage', function() {
  return app.src(lint)
    .pipe(app.pipeline('coverage'));
});

composer.task('test', ['coverage'], function() {
  return app.src('test/*.js')
    .pipe(app.pipeline('mocha', {
      dir: 'coverage',
      file: 'summary.txt'
    }));
});

composer.task('default', ['test']);

composer.build('default', function(err) {
  if (err) return console.log(err);
  console.log('cb.');
});

