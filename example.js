'use strict';

var mocha = require('gulp-mocha');
var stylish = require('jshint-stylish');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
var options = require('base-options');
var base = require('base-methods');
var bfs = require('base-fs');
var pipeline = require('./');

var app = base()
  .use(bfs)
  .use(options())
  .use(pipeline());

app.plugin('lint', function (options) {
  this.stream.pipe(jshint(options))
    .pipe(jshint.reporter(stylish));
});

app.plugin('coverage', function () {
  this.stream
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

app.plugin('test', function (options) {
  this.stream.pipe(mocha())
    .pipe(istanbul.writeReports())
    .pipe(istanbul.writeReports({
      reporters: [ 'text' ],
      reportOpts: options
    }))
});

app.src(['index.js'])
  .pipe(app.pipeline('lint'))

app.src(['index.js', 'test/*.js'])
  .pipe(app.pipeline('coverage'))
  .pipe(app.pipeline('test', {
    dir: 'coverage',
    file: 'summary.txt'
  }))
