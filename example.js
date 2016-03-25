'use strict';

var argv = require('minimist')(process.argv.slice(2));
var through = require('through2');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');

var base = require('base');
var pipeline = require('./');
var runtimes = require('base-runtimes');
var option = require('base-option');
var task = require('base-task');
var fs = require('base-fs');

// plugins
var app = base()
  .use(task())
  .use(option())
  .use(runtimes())
  .use(pipeline())
  .use(fs())

var lint = ['index.js', 'utils.js', 'test/*.js'];
var tasks = argv._.length ? argv._ : ['default'];

app.plugin('lint', function(options, stream) {
  return stream
    .pipe(eslint())
    .pipe(eslint.format());
});

app.plugin('coverage', function(options, stream) {
  return stream
    .pipe(istanbul({includeUntested: true}))
    .pipe(istanbul.hookRequire());
});

app.plugin('mocha', function(options, stream) {
  return stream.pipe(mocha(options));
});

app.plugin('reports', function(options, stream) {
  return stream
    .pipe(istanbul.writeReports())
    .pipe(istanbul.writeReports({
      reporters: ['html', 'text', 'text-summary'],
      reportOpts: {dir: 'coverage', file: 'summary.txt'}
    }))
});

app.task('lint', function() {
  return app.src(lint)
    .pipe(app.pipeline('lint'))
});

app.task('coverage', function() {
  return app.src(lint)
    .pipe(app.pipeline('coverage'));
});

app.task('test', ['coverage'], function() {
  return app.src('test/*.js')
    .pipe(app.pipeline('mocha'))
    .pipe(istanbul.writeReports())
    // .pipe(istanbul.writeReports({
    //   reporters: ['html', 'text', 'text-summary'],
    //   reportOpts: {dir: 'coverage', file: 'summary.txt'}
    // }));
});

app.task('default', ['lint', 'test']);

app.build(tasks, function(err) {
  if (err) return console.log(err);
  console.log('done!');
});

