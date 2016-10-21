(function() {
    'use strict';

    var ardentlink  = require('./ardentlink.js');
    var paths       = require('./package.json').paths;
    var conf        = require('./package.json').localConfig;
    var gulp        = require('gulp');
    var $           = require('gulp-load-plugins')({
        pattern: [
            'gulp-*', 'gulp.*', 'del', 'mkdirp', 'run-sequence'
        ],
        replaceString: /\bgulp[\-.]/
    });
    var browserSync = require('browser-sync').create();

    var ardentlink_conf = {
        glob:      paths.articles,
        template:  paths.source.templates_article,
        permalink: function(article) {
            var out = '/';
            if (article.date) {
                out += 'articles/' + article.date.format('YYYY-MM-DD') + '/';
            }
            return out + article.id + '/';
        }
    };

    var changeEvent = function(event) {
        var gutil = require('gulp-util');
        gutil.log(
            'File',
            gutil.colors.yellow(event.path.replace(__dirname, '')),
            'was',
            gutil.colors.blue(event.type)
        );
    };

    gulp.task('build', [
        'build:styles',
        'build:scripts',
        'build:images',
        'build:files',
        'build:files_root',
        'build:articles',
        'build:frontpage',
    ]);
    gulp.task('build:styles'    , buildStyles);
    gulp.task('build:scripts'   , buildScripts);
    gulp.task('build:images'    , buildImages);
    gulp.task('build:files'     , buildFiles);
    gulp.task('build:files_root', buildFilesRoot);
    gulp.task('build:articles'  , buildArticles);
    gulp.task('build:frontpage' , buildFrontpage);

    function buildStyles () {
        $.mkdirp(paths.build.styles);
        return gulp.src(paths.source.styles)
            .pipe($.plumber())
            .pipe($.sourcemaps.init())
            .pipe($.sass({
                outputStyle:  'expanded',
                includePaths: require('node-bourbon').includePaths
            }))
            .pipe($.autoprefixer(conf.autoprefixer))
            .pipe(gulp.dest(paths.build.styles))
            .pipe($.cleanCss())
            .pipe($.rename({suffix: '.min'}))
            .pipe($.sourcemaps.write('.'))
            .pipe(gulp.dest(paths.build.styles))
            .pipe(browserSync.stream({match: '**/*.css'}));
    }
    function buildScripts () {
        $.mkdirp(paths.build.scripts);
        return gulp.src(paths.source.scripts)
            .pipe($.plumber())
            .pipe($.sourcemaps.init())
            .pipe($.concat("all.min.js"))
            .pipe($.uglify({
                preserveComments: 'some' // Should be 'license', but that's dead
            }))
            .pipe($.sourcemaps.write('.'))
            .pipe(gulp.dest(paths.build.scripts))
            .pipe(browserSync.stream());
    }
    function buildImages () {
        $.mkdirp(paths.build.images);
        return gulp.src(paths.source.images)
            .pipe($.plumber())
            .pipe(gulp.dest(paths.build.images))
            .pipe(browserSync.stream());
    }
    function buildFiles () {
        $.mkdirp(paths.build.files);
        return gulp.src(paths.source.files)
            .pipe($.plumber())
            .pipe(gulp.dest(paths.build.files))
            .pipe(browserSync.stream());
    }
    function buildFilesRoot () {
        return gulp.src(paths.source.files_root)
            .pipe($.plumber())
            .pipe(gulp.dest(paths.build.base))
            .pipe(browserSync.stream());
    }
    function buildArticles() {
        return gulp.src(paths.articles)
            .pipe($.plumber())
            .pipe(ardentlink(ardentlink_conf))
            .pipe($.compileHandlebars())
            .pipe(gulp.dest(paths.build.base))
            .pipe(browserSync.stream());
    }

    function buildFrontpage() {
        return gulp.src(paths.source.templates_frontpage)
            .pipe($.plumber())
            .pipe(ardentlink(ardentlink_conf))
            .pipe($.compileHandlebars())
            .pipe($.rename('index.html'))
            .pipe(gulp.dest(paths.build.base))
            .pipe(browserSync.stream());
    }

    gulp.task('watch', [
        'watch:styles',
        'watch:scripts',
        'watch:images',
        'watch:files',
        'watch:files_root',
        'watch:templates',
        'watch:articles',
    ]);
    gulp.task('watch:styles'    , ['build:styles']    , watchStyles);
    gulp.task('watch:scripts'   , ['build:scripts']   , watchScripts);
    gulp.task('watch:images'    , ['build:images']    , watchImages);
    gulp.task('watch:files'     , ['build:files']     , watchFiles);
    gulp.task('watch:files_root', ['build:files_root'], watchFilesRoot);
    gulp.task('watch:templates' , ['build:articles'   , 'build:frontpage'], watchTemplates);
    gulp.task('watch:articles'  , ['build:articles'   , 'build:frontpage'], watchArticles);

    function watchStyles (cb) {
        gulp.watch(paths.source.styles, ['build:styles'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchScripts (cb) {
        gulp.watch(paths.source.scripts, ['build:scripts'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchImages (cb) {
        gulp.watch(paths.source.images, ['build:images'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchFiles (cb) {
        gulp.watch([
            paths.source.files
        ], ['build:files'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchFilesRoot (cb) {
        gulp.watch(paths.source.files_root, ['build:files_root'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchTemplates (cb) {
        gulp.watch(paths.source.templates, ['build:articles', 'build:frontpage'])
            .on('change', changeEvent);
        if (cb) cb();
    }
    function watchArticles (cb) {
        gulp.watch(paths.articles, ['build:articles', 'build:frontpage'])
            .on('change', changeEvent);
        if (cb) cb();
    }

    gulp.task('serve', ['build'], function() {
        browserSync.init({
            server:  { baseDir: './public/' },
            port:    1987,
            open:    false,
            browser: 'default',
            notify:  false
        });

        watchStyles();
        watchScripts();
        watchImages();
        watchFiles();
        watchFilesRoot();
        watchTemplates();
        watchArticles();
    });


    gulp.task('clean', function(cb) {
        return $.del([
            paths.build.base + '**/*',
            paths.build.base + '**/.*',
            paths.build.base + '.**/*',
            paths.build.base + '.**/.*',
        ], cb);
    });

    gulp.task('build:prod', function(cb) {
        return $.runSequence(
            'clean',
            'build',
            'revision',
            'revision:replace',
            cb
        );
    });

    gulp.task('revision', function() {
        return gulp.src([
            paths.build.base + '**/*.js',
            paths.build.base + '**/*.css',
            paths.build.base + '**/*.png',
            paths.build.base + '**/*.jpg',
            paths.build.base + '**/*.webp',
            paths.build.base + '**/*.svg',
            paths.build.base + '**/*.ico',
            paths.build.base + '**/*.pdf',
            paths.build.base + '**/*.xml',
            paths.build.base + '**/*.json',
            '!**/*browserconfig.xml',
            '!**/*manifest.json',
        ])
            .pipe($.plumber())
            .pipe($.rev())
            .pipe($.revDeleteOriginal())
            .pipe(gulp.dest(paths.build.base))
            .pipe($.rev.manifest(
                paths.build.base + 'rev-manifest.json', {
                    base:  paths.build.base,
                    merge: true
                }
            ))
            .pipe(gulp.dest(paths.build.base));
    });

    gulp.task('revision:replace', function() {
        var manifest = gulp.src(paths.build.base + 'rev-manifest.json');

        return gulp.src([
            paths.build.styles + '**/*.css',
            paths.build.base   + '**/*.html',
            paths.build.base   + 'browserconfig.xml',
            paths.build.base   + 'manifest.json',
        ])
            .pipe($.revReplace({
                manifest: manifest,
                replaceInExtensions: ['.js', '.css', '.html', '.json', '.xml']
            }))
            .pipe(gulp.dest(paths.build.base));
    });

})();
