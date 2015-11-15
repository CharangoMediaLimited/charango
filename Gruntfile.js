/**
 * Excellent article for getting started with Grunt :)
 * https://24ways.org/2013/grunt-is-not-weird-and-hard/
 */
module.exports = function(grunt) {

    // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

         clean: {
            build: {
                src: ["deploy"]
            }
         },

         concat: {
             dist: {
                 src: [
                     'src/js/libs/*.js',
                     'src/js/*.js'
                 ],
                 dest: 'deploy/js/production.js'
             }
         },

         uglify: {
             build: {
                 src: 'deploy/js/production.js',
                 dest: 'deploy/js/production.min.js'
             }
         },

         imagemin: {
             dynamic: {
                 files: [{
                     expand: true,
                     cwd: 'src/img/',
                     src: ['**/*.{png,jpg,gif,svg,mp4}'],
                     dest: 'deploy/img'
                 }]
             }
         },

         less: {
             dist: {
                 options: {
                     style: 'compressed'
                 },
                 files: {
                     'deploy/css/production.css': 'src/css/*.less'
                 }
             }
         },

         watch: {
             options: {
                 livereload: true
             },

             /**scripts: {
                 files: ['src/js/*.js'],
                 tasks: ['concat', 'uglify'],
                 options: {
                     spawn: false
                 }
             }*/

             css: {
                 files: ['src/css/*.less'],
                 tasks: ['less'],
                 options: {
                     spawn: false
                 }
             }
         },

         autoprefixer: {
             dist: {
                 files: {
                     'deploy/css/production.css': 'deploy/css/production.css'
                 }
             }
         },

         copy: {
             main: {
                 files: [{
                     expand: true,
                     flatten: true,
                     src: 'src/*.*',
                     dest: 'deploy/'
                 },
                 {
                      expand: true,
                      flatten: true,
                      src: 'src/css/vendor/*.css',
                      dest: 'deploy/css/vendor/'
                  }]
             }
         }
    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-clean'); // clean files/directories   npm install grunt-contrib-clean --save-dev
    grunt.loadNpmTasks('grunt-contrib-concat'); // concat js files          npm install grunt-contrib-concat --save-dev
    grunt.loadNpmTasks('grunt-contrib-uglify'); // minify js files          npm install grunt-contrib-uglify --save-dev
    grunt.loadNpmTasks('grunt-contrib-imagemin'); // optimise images        npm install grunt-contrib-imagemin --save-dev
    grunt.loadNpmTasks('grunt-contrib-less'); // less                       npm install grunt-contrib-less --save-dev
    grunt.loadNpmTasks('grunt-contrib-watch'); // watch                     npm install grunt-contrib-watch --save-dev
    grunt.loadNpmTasks('grunt-autoprefixer'); // autoprefixer               npm install grunt-autoprefixer --save-dev
    grunt.loadNpmTasks('grunt-contrib-copy'); // copy files                 npm install grunt-contrib-copy --save-dev

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['clean', 'concat', 'uglify', 'imagemin', 'less', 'autoprefixer', 'copy']);  // taken out 'watch' for now
};

