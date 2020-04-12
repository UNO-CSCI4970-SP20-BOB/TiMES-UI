'use strict';

const gulp = require('gulp');
const gulpStylelint = require('gulp-stylelint');
const gulpSass = require('gulp-sass');
const gulpSourcemaps = require('gulp-sourcemaps');
const gulpJsdoc = require('gulp-jsdoc3');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const browserSync = require('browser-sync');
const del = require('del');

const packageJson = require('./package.json');
const webpackConfig = require('./webpack.config')

const dirs = {
    src: './src',
    dest: './dist',
    docs: './docs'
};

const sources = {
    scss: `${dirs.src}/scss/**/*.scss`,
    static: `${dirs.src}/static/**/*`,
    js: `${dirs.src}/js/**/*.js`
}

const destinations = {
    scss: `${dirs.src}/scss`,
};

const currentDocsDir = `${dirs.docs}/${packageJson.name}/${packageJson.version}`;

function buildStatic(done) {
    return gulp.src(sources.static)
        .pipe(gulp.dest(dirs.dest));
}
buildStatic.description = 'Compile Static files to output folder.';

gulpSass.compiler = require('sass');
function buildStyles(done) {
    return gulp.src(sources.scss)
        .pipe(gulpSourcemaps.init())
        .pipe(gulpSass(packageJson.sass).on('error', gulpSass.logError))
        .pipe(gulpSourcemaps.write())
        .pipe(gulp.dest(dirs.dest))
        .pipe(browserSync.stream());
}
buildStyles.description = 'Compile Sass files to output folder.';

function buildScripts(done) {
    webpackConfig.mode = 'development';

    return gulp.src(sources.js)
        .pipe(webpackStream(webpackConfig, webpack))
        .pipe(gulp.dest(dirs.dest));
}
buildScripts.description = 'Compile JavaScript files to output folder.';

function buildDocs(done) {
    cleanCurrentDocs();

    packageJson.jsDoc.opts = packageJson.jsDoc.opts || {};
    packageJson.jsDoc.opts.destination = dirs.docs;

    return gulp.src(sources.js)
        .pipe(gulpJsdoc(packageJson.jsDoc, done));
}
buildDocs.description = 'Compile JavaScript documentation files to docs folder.';

function fixStyles(done) {
    return gulp.src(sources.scss)
        .pipe(gulpStylelint({
            fix: true,
            reporters: [
                {
                    formatter: 'string',
                    console: true
                }
            ]
        }))
        .pipe(gulp.dest(destinations.scss));
}
fixStyles.description = 'Fix Sass files to follow project formatting.';

function watch(done) {
    browserSync.init({
        server: {
            baseDir: dirs.dest
        },
        open: false
    });
    gulp.watch(sources.static, buildStatic).on('change', function () { browserSync.reload() });
    gulp.watch(sources.scss, buildStyles);
    gulp.watch(sources.js, buildScripts).on('change', function () { browserSync.reload() });
}
watch.description = 'Run BrowserSync, watch for file changes, and rebuild when needed.';

function clean(done) {
    return del([dirs.dest]);
}
clean.description = 'Cleans up generated files.';

function cleanDocs(done) {
    return del([dirs.docs]);
}
cleanDocs.description = 'Cleans up all generated documentation.';

function cleanCurrentDocs(done) {
    return del([currentDocsDir]);
}
cleanDocs.description = 'Cleans up current version of generated documentation.';

const build = gulp.series(clean, fixStyles, gulp.parallel(buildStatic, buildStyles, buildScripts));
build.description = 'Compile all files to output folder.';

const dev = gulp.series(build, watch);
dev.description = 'Build files and watch for changes.';

module.exports = {
    buildStatic: buildStatic,
    buildStyles: buildStyles,
    buildScripts: buildScripts,
    buildDocs: buildDocs,
    fixStyles: fixStyles,
    watch: watch,
    clean: clean,
    cleanDocs: cleanDocs,
    cleanCurrentDocs: cleanCurrentDocs,
    build: build,
    dev: dev,
    default: dev
}



