/*
 * This is heavily based on gulp-mvb with slight modifications
 *
 * @link <https://github.com/dennisreimann/gulp-mvb>
 */
(function() {
    'use strict';

    var fs          = require('fs');
    var path        = require('path');
    var glob        = require('glob');
    var extend      = require('util-extend');
    var marked      = require('marked');
    var through     = require('through2');
    var yamlFront   = require('yaml-front-matter');
    var moment      = require('moment');
    var highlightjs = require('highlight.js');

    module.exports = (function() {
        var err = function(message) {
            throw new PluginError('ardentlink', message);
        };

        var findArticles = function(globs) {
            return globs.reduce(function(list, pattern) {
                return list.concat(glob.sync(pattern));
            }, []);
        };

        var loadArticles = function(globs, permalink) {
            var files = findArticles(globs);
            var prev_article;

            return files.map(function(file) {
                var article = loadArticle(file, permalink);

                if (!article.date) {
                    return article;
                }

                if (prev_article) {
                    prev_article.next_article = article;
                }
                article.previous_article = prev_article;
                prev_article = article;

                return article;
            });
        };

        var loadArticle = function(file_path, permalink) {
            var input     = fs.readFileSync(file_path);
            var article   = yamlFront.loadFront(input);
            var file_name = path.basename(file_path);
            var file_info = file_name.match(/(\d{4}-\d{2}-\d{2})-(.*)\./);

            if (file_info) {
                if (!article.id)   article.id = file_info[2];
                if (!article.date) article.date = new Date(file_info[1]);

                article.date       = moment(article.date);
                article.date_human = article.date.format('MMMM Do Y');
            } else {
                article.id = file_name.replace('.md', '');
                if (!article.date) article.date = null;
            }

            article.file_name  = file_name;
            article.permalink = permalink(article);
            article.content   = marked(article.__content, {
                smartypants: true
            });
            delete article.__content;

            var more = /<!-- more -->/i;
            var desc = article.content.match(more);
            if (desc && desc.index) {
                article.content = article.content.replace(more, '<div id="more"></div>');

                if (!article.description) {
                    article.description = desc.input
                        .substring(0, desc.index)
                        .replace(/(<([^>]+)>)/ig, "")
                        .trim();
                }
            }

            return article;
        };

        return function(options) {
            if (!options.glob)                           { err('Missing glob option'); }
            if (!options.template)                       { err('Missing template option'); }
            if (typeof(options.permalink) != "function") { err('Missing permalink function'); }

            if (!Array.isArray(options.glob)) { options.glob = [options.glob]; }

            var highlight = function(code, lang, d) {
                if (!lang) {
                    return highlightjs.highlightAuto(code).value;
                }
                return highlightjs.highlight(lang, code).value;
            };
            marked.setOptions({ highlight: highlight });

            var globs      = options.glob;
            var template   = fs.readFileSync(options.template);
            var permalink  = options.permalink;
            var articles   = loadArticles(globs, permalink).reverse();
            var map        = articles.reduce(function(mapped, article) {
                mapped[article.file_name] = article;
                return mapped;
            }, {});

            return through.obj(function(file, unused, callback) {
                var article = map[path.basename(file.path)];

                if (!file.data) { file.data = {}; }

                file.data.articles = articles.filter(function(article) {
                    return !!article.date;
                });

                if (article) {
                    file.data     = extend(file.data, article);
                    file.path     = path.join(file.base, article.permalink + 'index.html');
                    file.contents = template;
                }

                callback(null, file);
            });
        };
    })();
})();
