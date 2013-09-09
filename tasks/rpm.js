/*
 * rpm
 * 
 *
 * Copyright (c) 2013 Gaston Elhordoy
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var spec = require('./lib/default-spec-writer');

// TODO try adding also the BUILDROOT folder
var tmpFolder = 'tmp';
var specFolder = 'SPECS';
var folders = ['BUILD', 'RPMS', 'SOURCES', 'SRPMS', specFolder];


/**
 * Filter all the specified files discarding invalid ones.
 * 
 * TODO think about making this asynchronous
 */
function filterFiles(grunt, files) {
	var filesToPack = [];
	
	files.forEach(function(fileMapping) {
		// Fail if there is no dest field defined
		if (!fileMapping.dest) {
			grunt.warn('No destination folder is defined for source "' + fileMapping.src + '"');
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
				var fileConfig = grunt.util._.omit(fileMapping, 'src', 'orig');
				fileConfig.path = filepath;
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
				
				if (grunt.file.isDir(fileConfig.path)) {
					// Create a folder inside the destination directory.
					grunt.verbose.writeln('Creating folder "' + filepathDest + '"');
					grunt.file.mkdir(filepathDest);
				} else {
					// Copy a file to the destination directory inside the tmp folder.
					grunt.verbose.writeln('Copying file "' + fileConfig.path + '" to "' + filepathDest + '"');
					grunt.file.copy(fileConfig.path, filepathDest);
				}
				callback();
			} catch(e) {
				callback(e);
			}
		}, callback);
	};
}

/**
 * Write the spec file that rpmbuild will read for the rpm details
 */
function writeSpecFile(grunt, specPath, options, filesToPack) {
	return function(callback) {
		try {
			options.files = filesToPack;
			var pkg = grunt.file.readJSON(path.resolve('package.json'));
			grunt.util._.defaults(options, pkg);
			
			options.specFilepath = path.join(specPath, options.name + '.spec');
			spec(options, callback);
		} catch(e) {
			callback(e);
		}
	};
}

/**
 * Execute rpmbuild as child process passing in the specific details for building this rpm.
 * rpmbuild -bb --target noarch --buildroot '/path/to/destination/TMP' --define='_topdir /path/to/destination' '/path/to/destination/SPECS/project.spec'
 */
function spawnRpmbuild(grunt, buildPath, rootPath, specFilepath) {
	return function(callback) {
		// FIXME make the hardcoded target architecture platform configurable
		var options = {
			cmd: 'rpmbuild',
			args: ['-bb', '--target', 'noarch', '--buildroot', buildPath, '--define', '\'_topdir ' + rootPath + '\'', specFilepath],
			// Additional options for the Node.js child_process spawn method.
//			opts: nodeSpawnOptions,
		};
		grunt.util.spawn(options, function(err, result, code) {
			// TODO check code [and result] for more detailed response
			callback(err);
		});
	};
}


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
		var specPath = path.join(options.destination, specFolder);
		var buildPath = path.join(options.destination, tmpFolder);
		var filesToPack = filterFiles(grunt, this.files);
		
		// Dispatch sequence of tasks to be performed in order to get the rpm
		grunt.util.async.series([
			function(callback) {
				grunt.util.async.parallel([
					copyFilesToPack(grunt, buildPath, filesToPack),
					writeSpecFile(grunt, specPath, options, filesToPack)
				], callback);
			},
			spawnRpmbuild(grunt, buildPath, options.destination, options.specFilepath)
		], done);
	};
}

module.exports = function(grunt) {
	// Please see the Grunt documentation for more information regarding task creation: http://gruntjs.com/creating-tasks
	grunt.registerMultiTask('rpm', 'Grunt plugin to create RPM packages out of a project.', createRpmMultiTask(grunt));
};
