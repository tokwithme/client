
module.exports = function(grunt) {



	// ---

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),


		bower_concat: {
			all: {
				mainFiles: {
					'jquery': 'dist/jquery.min.js'
				},
				dest: 'web/build/bower.js'
			}
		}


	});

	//grunt.loadNpmTasks('grunt-contrib-clean');
	//grunt.loadNpmTasks('grunt-contrib-uglify');
	//grunt.loadNpmTasks('grunt-contrib-cssmin');
	//grunt.loadNpmTasks('grunt-contrib-jshint');
	//grunt.loadNpmTasks('grunt-autoprefixer');
	//grunt.loadNpmTasks('grunt-contrib-less');
	//grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-bower-concat');

	// Default task(s).
	grunt.registerTask('default', ['build']);
	grunt.registerTask('build',	['bower_concat']);
	//grunt.registerTask('build-css',	['less:build', 'less:bootstrap', 'autoprefixer:build', 'cssmin']);
	//grunt.registerTask('build-js',	['uglify']);


};