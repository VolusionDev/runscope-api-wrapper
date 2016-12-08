const gulp = require('gulp');
require('git-guppy')(gulp);
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const runSequence = require('run-sequence').use(gulp);
const del = require('del');
const fs = require('fs');

gulp.task('pre-commit', ['build:lint']);

gulp.task('default', ['test:unit']);

gulp.task('build:clean', () => {
  return del(['dist/**/*', 'build/**/*', 'babeled/**/*']);
});

gulp.task('test:unit', ['build:lint'], () => {
  return gulp.src('test/unit/**/*.js', {read: false})
    .pipe(mocha());
});

gulp.task('test:integration', ['build:lint'], () => {
  return gulp.src('test/integration/**/*.js', {read: false})
    .pipe(mocha());
});

gulp.task('build:lint', () => {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

gulp.task('build:babel', ['build:lint'], callback => {
  gulp.src(['src/**/*.js'], {base: './src'})
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'))
    .on('end', () => callback());
});

gulp.task('npmrc', () => {
  const npmKey = process.env.NPM_KEY;
  fs.writeFileSync('.npmrc', npmKey);
  console.log(npmKey);
});

gulp.task('deploy', callback => {
  runSequence(
    'build:clean',
    'build:babel',
    'test:unit',
    'test:integration',
    callback);
});
