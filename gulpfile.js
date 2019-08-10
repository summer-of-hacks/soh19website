require('dotenv').load();

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var htmlmin = require('gulp-html-minifier');
var inlinesource = require('gulp-inline-source');
var uglify = require('gulp-uglify');
var less = require('gulp-less');
var RevAll = require('gulp-rev-all');
var data = require('gulp-data');
var handlebars = require('gulp-compile-handlebars');
var moment = require('moment');
var eventData = require('./lib/event-data.js');
var rollup = require('gulp-rollup');

var paths = {
  assets: [
    'src/CNAME',
    'src/icons/*',
    'src/images/*',
    'src/slides/*'
  ],
  js: [
    'src/bower/webfontloader/webfontloader.js',
    'src/script.js'
  ]
};

gulp.task('html', function() {
  return gulp.src('src/index.html')
    .pipe(data(eventData('events/2019/*.md')))
    .pipe(handlebars(null, {
      helpers: {
        short_date: function(str) {return moment(str).format("Do MMM");}
      }
    }))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('html.dist', ['html', 'less'], function(){
  return gulp.src('build/index.html')
    .pipe(inlinesource())
    .pipe(htmlmin({
      minifyJS: true,
      minifyCSS:true,
      removeComments: true,
      collapseWhitespace: true
    }))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('less', function() {
  return gulp.src('src/style.less')
    .pipe(less())
    .pipe(autoprefixer())
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('js', function() {
  return gulp.src(paths.js)
    .pipe(concat('all.js', {newLine:';'}))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('sw', function(){
  gulp.src('src/sw.js', {read: false})
    .pipe(rollup({
      format: 'cjs',
    }))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('js.dist', ['js', 'sw'], function() {
  return gulp.src(['build/all.js', 'build/sw.js'])
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});

// note: all asset paths are flattened
gulp.task('assets', function() {
  return gulp
    .src(paths.assets)
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('serve', ['build'], function() {
  connect.server({
    root: 'build',
    livereload: true
  });
});

gulp.task('build',      ['html', 'less', 'js', 'sw', 'assets']);
gulp.task('build.dist', ['html.dist', 'less', 'js.dist', 'assets']);

gulp.task('watch', function () {
  gulp.watch(['src/index.html','events/*/*.md'], ['html']);
  gulp.watch(['src/style.less'], ['less']);
  gulp.watch(paths.assets, ['assets']);
  gulp.watch(paths.js, ['js']);
  gulp.watch('src/sw.js', ['sw']);
});

gulp.task('default', ['serve', 'watch', 'build']);

gulp.task('deploy', ['deploy:gh']);
