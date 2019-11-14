const { src, dest } = require('gulp');
const minifyInline = require('gulp-minify-inline');
const htmlmin = require('gulp-htmlmin');

function build(cb) {
  src('inlined/*.html')
    .pipe(minifyInline())
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(dest('build'))
  cb();
}

exports.default = build;