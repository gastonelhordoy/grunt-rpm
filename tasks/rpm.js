/*
 * rpm
 * 
 *
 * Copyright (c) 2013 Gaston Elhordoy
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var fs = require('fs.extra');
var spec = require('./lib/default-spec-writer');

// TODO try adding also the BUILDROOT folder
var tmpFolder = 'tmp';
var specFolder = 'SPECS';
var folders = ['BUILD', 'RPMS', 'SOURCES', 'SRPMS', specFolder];


/**
 * Filter all the specified files discarding invalid ones.
 * TODO make this asynchronous.
 * @param {Grunt} grunt - the grunt instance.
 * @param {Array} files - list of file mappings already resolved by grunt.
 * @returns {Array} list of file configuration filtered by invalid sources and with additional configuration that might come along with each file mapping.
 */
function filterFiles(grunt, files) {
	var filesToPack = [];
	
	files.forEach(function(fileMapping) {
		// Fail if there is no dest field defined
		if (!fileMapping.dest) {
			grunt.warn('No destination folder is defined for source "' + fileMapping.src + '"');
		}
		if (fileMapping.relativeTo && !grunt.file.isDir(fileMapping.relativeTo)) {
			grunt.warn('The path specified for relativeTo is not a directory "' + fileMapping.relativeTo + '"');
		}
		
		// Evaluate specified source files to determine what to do in each case
		fileMapping.src.forEach(function(filepath) {
			// Warn on invalid source files (if nonull was set).
			if (!grunt.file.exists(filepath)) {
				grunt.log.warn('Source file "' + filepath + '" does not exists');
			} else if (grunt.file.isLink(filepath)) {
				// TODO handle links
				grunt.log.warn('Source file "' + filepath + '" is a link and it not supported yet');
			} else {
				
				var fileConfig = grunt.util._.omit(fileMapping, 'src', 'orig', 'filter');
				fileConfig.src = filepath;
				if (fileMapping.directory) {
					if (grunt.file.isDir(filepath)) {
						fileConfig.directory = true;
					} else {
						grunt.log.warn('The path %s is not a directory but it is marked as such', filepath, fileMapping.relativeTo);
					}
				}
				if (fileMapping.relativeTo) {
					if (grunt.file.doesPathContain(fileMapping.relativeTo, filepath)) {
						fileConfig.path = path.relative(fileMapping.relativeTo, filepath);
					} else {
						grunt.log.warn('The path %s is not contained into the relativeTo directory %s', filepath, fileMapping.relativeTo);
					}
				} else {
					fileConfig.path = filepath;
				}
				filesToPack.push(fileConfig);
			}
		});
	});
	
	return filesToPack;
}

/**
 * Copy all the selected files to the tmp folder which wikll be the buildroot directory for rpmbuild 
 */
function copyFilesToPack(grunt, buildPath, filesToPack) {
	return function(callback) {
		grunt.util.async.forEach(filesToPack, function(fileConfig, callback) {
			try {
				var filepathDest = path.join(buildPath, fileConfig.dest, fileConfig.path);
				
				if (grunt.file.isDir(fileConfig.src)) {
					if (fileConfig.directory) {
						// Copy a whole folder to the destination directory.
						grunt.verbose.writeln('Copying folder "' + fileConfig.src + '" to "' + filepathDest + '"');
						fs.copyRecursive(fileConfig.src, filepathDest, callback);
					} else {
						// Create a folder inside the destination directory.
						grunt.verbose.writeln('Creating folder "' + filepathDest + '"');
						grunt.file.mkdir(filepathDest);
						callback();
					}
				} else {
					// Copy a file to the destination directory inside the tmp folder.
					grunt.verbose.writeln('Copying file "' + fileConfig.src + '" to "' + filepathDest + '"');
					grunt.file.copy(fileConfig.src, filepathDest);
					callback();
				}
				
			} catch(e) {
				callback(e);
			}
		}, callback);
	};
}

/**
 * Write the spec file that rpmbuild will read for the rpm details
 */
function writeSpecFile(grunt, options, filesToPack) {
	return function(callback) {
		try {
			var specPath = path.join(options.destination, specFolder);
			options.files = filesToPack;
			var pkg = grunt.file.readJSON('package.json');
			grunt.util._.defaults(options, pkg);
			
			options.specFilepath = path.join(specPath, options.name + '.spec');
			spec(options, callback);
		} catch(e) {
			callback(e);
		}
	};
}

/**
 * Execute rpmbuild as child process passing in the specific details for building this rpm.<br><br>
 * <code>rpmbuild -bb --target noarch --buildroot '/path/to/destination/tmp' --define='_topdir /path/to/destination' '/path/to/destination/SPECS/project.spec'</code>
 * 
 * @param {Grunt} grunt - the grunt instance.
 * @param {String} buildPath - relative path to the destination folder where rpmbuilder folder structure resides.
 * @param {Object} options - the options object.
 * @returns {Function} async function that executes the callback once it is done.
 */
function spawnRpmbuild(grunt, buildPath, options) {
	return function(callback) {
		// FIXME make the hard-coded target architecture platform configurable as well as targetVendor and targetOs
		// --target noarch-redhat-linux
		var buildroot = path.join(process.cwd(), buildPath);
//		var topdir = path.join(process.cwd(), options.destination);
		var specfile = path.join(process.cwd(), options.specFilepath);
		
		// FIXME the --define command line parameter is not taken into account by rpmbuild so a macro definition must be specified in the spec file
		var rpmbuildOptions = {
			cmd: 'rpmbuild',
			args: ['-bb', '--target', 'noarch', '--buildroot', buildroot, /*'--define=\'_topdir ' + topdir + '\'',*/ specfile],
			// Additional options for the Node.js child_process spawn method.
			// check http://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
//			opts: nodeSpawnOptions,
		};
		
		grunt.log.writeln('Spawning rpmbuild: %j', rpmbuildOptions);
		grunt.util.spawn(rpmbuildOptions, function(err, result, code) {
			// TODO check code [and result] for more detailed response
			callback(err);
		});
	};
}


/**
 * @param {Grunt} grunt - the grunt instance.
 * @returns {Function} function to be called whenever the 'rpm' task is run.
 */
function createRpmMultiTask(grunt) {
	return function() {
		// Tell Grunt this task is asynchronous.
		var done = this.async();

		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			destination: 'rpm'
		});
		
		// Create the folder structure needed by rpmbuild.
		grunt.file['delete'](options.destination);
		for (var i in folders) {
			grunt.file.mkdir(path.join(options.destination, folders[i]));
		}
		
		// Compute required information
		var buildPath = path.join(options.destination, tmpFolder);
		var filesToPack = filterFiles(grunt, this.files);
		
		// Dispatch sequence of tasks to be performed in order to get the rpm
		grunt.util.async.series([
			function(callback) {
				grunt.util.async.parallel([
					copyFilesToPack(grunt, buildPath, filesToPack),
					writeSpecFile(grunt, options, filesToPack)
				], callback);
			},
			spawnRpmbuild(grunt, buildPath, options)
		], done);
	};
}

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('rpm', 'Grunt plugin to create RPM packages out of a project.', createRpmMultiTask(grunt));
};
