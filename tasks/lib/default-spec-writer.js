
var path = require('path');
var fs = require('fs');

function formatTwoDigists(number) {
	if (number < 10) {
		return '0' + number;
	} else {
		return number;
	}
}

function formatTimestamp(date) {
	var str = date.getFullYear();
	str += formatTwoDigists(date.getMonth());
	str += formatTwoDigists(date.getDate());
	str += formatTwoDigists(date.getHours());
	str += formatTwoDigists(date.getMinutes());
	str += formatTwoDigists(date.getSeconds());
	return str;
}

function optionalValue(value, defaultValue) {
	defaultValue = defaultValue || '-';
	return value ? value : defaultValue;
}

function formatField(label, attr, separator) {
	separator = separator || ': ';
	var str = '';
	
	if (attr) {
		str = label + separator + attr + '\n';
	}
	return str;
}

function formatLabeledList(label, list) {
	list = list || [];
	var str = '';
	
	for(var i in list) {
		str += formatField(label, list[i]);
	}
	return str;
}

function formatFileList(options) {
	var str = '';
	
	if (options.files && options.files.length > 0) {
		str += '\n%files\n';
		if (options.defaultFilemode || options.defaultUsername || options.defaultGroupname || options.defaultDirmode) {
			str += '%defattr(' 
				+ optionalValue(options.defaultFilemode) + ',' 
				+ optionalValue(options.defaultUsername) + ',' 
				+ optionalValue(options.defaultGroupname) + ','
				+ optionalValue(options.defaultDirmode) + ')\n';
		}
		for (var i in options.files) {
			var rpmFile = options.files[i];
			if (!rpmFile.noRecursion) {
				if (rpmFile.filemode || rpmFile.username || rpmFile.groupname) {
					str += '%attr(' 
						+ optionalValue(rpmFile.filemode) + ',' 
						+ optionalValue(rpmFile.username) + ',' 
						+ optionalValue(rpmFile.groupname) + ') ';
				}
				str += path.join(path.sep, rpmFile.dest, rpmFile.path) + '\n';
			} else {
				str += '%dir ' + path.join(path.sep, rpmFile.dest + rpmFile.path) + '\n';
			}
		}
	}
	
	return str;
}

/**
 * Provides utility methods to execute a command
 * @module exec
 */
module.exports = function(options, callback) {
	var src = formatField('Name', options.name);
	src += formatField('Version', options.version);
	src += 'Release: ';
	if (options.release) {
		src += '1\n';
	} else {
		src += 'SNAPSHOT' + formatTimestamp(new Date()) + '\n';
	}
	
	src += formatField('URL', options.homepage);
	src += formatField('Summary', options.summary);
	src += formatField('License', options.license);
	src += formatField('Distribution', options.distribution);
	src += formatField('Vendor', options.vendor);
	src += formatField('Group', options.group);
	src += formatLabeledList('Requires', options.requires);
	src += formatField('autoprov', 'yes');
	src += formatField('autoreq', 'yes');
	src += formatField('\n%description', options.description, '\n');
	src += formatFileList(options);

	fs.writeFile(options.specFilepath, src, callback);
};
