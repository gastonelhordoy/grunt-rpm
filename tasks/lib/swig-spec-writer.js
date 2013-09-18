
var swig = require('swig');
var path = require('path');
var fs = require('fs');

/**
 * Provides utility methods to execute a command
 * @module exec
 */
module.exports = function(grunt, options, callback) {
	var templatePath = path.join(__dirname, 'spec.tmpl');
	
	swig.renderFile(templatePath, {rpm: options}, function (err, output) {
		if (err) {
			callback(err);
			return;
		}

		fs.writeFile(options.specFilepath, output, callback);
	});
};
