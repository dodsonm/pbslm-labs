/*jslint white:true, sloppy: true */
/*global module  */

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        /**
         * For compiling the less files
         */
        less: {
            main_css: {
                files: [{
                    expand: true,
                    cwd: 'less',
                    src: 'main.less',
                    dest: 'css',
                    ext: '.css'
                }]
            },
            main_css_min: {
                files: [{
                    expand: true,
                    cwd: 'less',
                    src: 'main.less',
                    dest: 'css',
                    ext: '.min.css'
                }],
                options: {
                    compress: true
                }
            },
            resources_css: {
                files: {'css/resource-pages.css' : 'less/resource-pages.less'},
                options : {
                    expand: true,
                    ext: '.css',
                    compress: false
                }
            },
            resources_css_min: {
                files: {'css/resource-pages.min.css' : 'less/resource-pages.less'},
                options : {
                    expand: true,
                    ext: '.css',
                    compress: true
                }
            },
            homepage_css: {
                files: {'css/homepage.css' : 'less/homepage.less'},
                options : {
                    expand: true,
                    ext: '.css',
                    compress: false
                }
            },
            homepage_css_min: {
                files: {'css/homepage.min.css' : 'less/homepage.less'},
                options : {
                    expand: true,
                    ext: '.css',
                    compress: true
                }
            }
        },
        uglify: {
            main_js: {
                src: 'js/pbslm.responsive.js',
                dest: 'js/pbslm.responsive.min.js'
            }
        },
        jshint: {
            uses_defaults: ['js/pbslm.responsive.js']
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'css/',
                src: ['*.css', '!*.min.css'],
                dest: 'css/',
                ext: '.min.css'
            }
        },
        stripmq: {
            //Viewport options
            options: {
                width: 1025,
                type: 'screen'
            },
            all: {
                files: [{
                    //follows the pattern 'destination': ['source']
                    'css/homepage-ie.css': 'css/homepage.css'
                },
                {
                    'css/resource-pages-ie.css': 'css/resource-pages.css'
                },
                {
                    'css/main-ie.css': 'css/main.css'
                }
                ]
            }
        },
        browser_sync: {
            bsFiles: {
                src : [
                  'css/**/*.css',
                  '!css/**/*.min.css',
                  'js/**/*.js'
                ]
            },
            options: {
                host: 'localhost',
                watchTask: true
            }
        },
        concurrent: {
            tasks: ['watch:less_to_css_main', 'watch:less_to_css_homepage', 'watch:less_to_css_resource','watch:css_for_ie', 'watch:uglify_js'],
            options: {
                limit: 4,
                logConcurrentOutput: true
            }
        },
        watch: {
            less_to_css_main: {
                files: 'less/**/*.less',
                tasks: ['less:main_css', 'less:main_css_min']
            },
            less_to_css_homepage: {
                files: 'less/**/*.less',
                tasks: ['less:homepage_css', 'less:homepage_css_min']
            },
            less_to_css_resource: {
                files: 'less/**/*.less',
                tasks: ['less:resources_css', 'less:resources_css_min']
            },
            uglify_js: {
                files: 'js/pbslm.responsive.js',
                tasks: ['uglify:main_js', 'jshint']
            },
            css_for_ie: {
                files: ['css/homepage.css','css/main.css','css/resource-pages.css'],
                tasks: ['stripmq']
            }
        }
    });

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-stripmq');

    // note: order of tasks is important
    grunt.registerTask('watch-n-sync', ['concurrent:tasks']);
    grunt.registerTask('optional', ['uglify', 'browser_sync', 'watch']);
    grunt.registerTask('track-resources', ['browser_sync', 'watch:less_to_css_resource']);

};