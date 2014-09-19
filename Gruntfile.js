
module.exports = function(grunt) {

	var
		cfg = grunt.file.readJSON('deploy/cfg_stub.json'),

		opt = {
			server: grunt.option('server') || 'def',
			target: grunt.option('deploy') || 'quick'
		}
	;

	// read deploy json config, catch error in case file doesn't exist
	try {
		cfg.file = grunt.file.readJSON('deploy/cfg.json');
		cfg.ok = 1;
		cfg.serverCfg = cfg.file.server[opt.server];
		cfg.deployCommands = cfg.file.deploy[opt.target];
	} catch(e) {
		// file not found
		console.log('/deploy/cfg.json not found');
	}



	// ---

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),
		cfg: cfg,

		bower_concat: {
			all: {
				mainFiles: {
					'jquery': 'dist/jquery.min.js',
					//'angular': 'angular.min.js',
					'ngstorage': 'ngStorage.min.js'
				},
				dest: 'web/build/bower.js'
			}
		},

		sshconfig: {
			myhost: cfg.serverCfg.sshconfig
		},

		sshexec: {
			build: {
				command: sshCommandsVerbose(cfg.deployCommands).join(' && '),
				options: {
					config: 'myhost'
				}
			}
		},

		open: {
			build: {
				path: cfg.serverCfg.url
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
	grunt.loadNpmTasks('grunt-ssh');
	grunt.loadNpmTasks('grunt-open');

	// Default task(s).
	grunt.registerTask('default', ['build']);
	grunt.registerTask('build',	['bower_concat']);
	//grunt.registerTask('build-css',	['less:build', 'less:bootstrap', 'autoprefixer:build', 'cssmin']);
	//grunt.registerTask('build-js',	['uglify']);
	grunt.registerTask('deploy', ['sshexec', 'open']);


	// Some helper functions

	function sshCommandsVerbose(cmds) {
		var
			a = []
			;

		for(var i=0; i<cmds.length; i++) {
			a.push("echo -e '\\e[1;30m>>> "+cmds[i]+"\\e[0m'");
			a.push(cmds[i]);
		}

		return a;
	}


};