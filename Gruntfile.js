module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jade: {
      all: {
        files: {
          'build/index.html': ['index.jade']
        }
      } 
    },
    stylus: {
      all: {
        files: {
          'build/style.css': ['style.styl']
        }
      }
    },
    watch: {
      app: {
        files: ['dataRequests.js','cyto.js','model.js','index.jade','style.styl'],
        tasks: ['default']
      }
    },
    uglify: {
      app: {
        files: {
          'build/cyto.js': 'cyto.js',
          'build/model.js': 'model.js',
          'build/dataRequests.js':'dataRequests.js'
        }
      },
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      }
    },
    jshint: {
      all: ['**.js'], //lint all js files in the project
      app: ['cyto.js','model.js','dataRequests.js'],
      options: {
        //ENVIRONMENT GLOBALS
        browser: true,
        jquery: true,
        devel: true,
        worker: true, //web Workers
        globals: {
          cytoscape: false
        },

        //OTHER OPTIONS
        curly: true,  //always put curly braces, even around single line if's
        indent: 2,     //2 space per tab default
        undef: true,  //catch accidental typos (undefined global vars)
        unused:true,  //catch unused vars
        strict: false  //use strict mode
      }
    },
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jade');
  grunt.loadNpmTasks('grunt-contrib-stylus');

  grunt.registerTask('compile', ['jade:all','stylus:all']);
  grunt.registerTask('default', ['compile',/*'jshint:app',*/'uglify:app']);
};