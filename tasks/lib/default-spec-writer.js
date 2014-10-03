
var path = require('path');
var fs = require('fs');


function unixifyPath(filepath) {
	if (process.platform === 'win32') {
		return filepath.replace(/\\/g, '/');
	} else {
		return filepath;
	}
}

function formatTwoDigists(number) {
	if (number < 10) {
		return '0' + number;
	} else {
		return number.toString();
	}
}

function formatTimestamp(date) {
	var str = date.getFullYear() + '';
	str += formatTwoDigists(date.getMonth() + 1);
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
//			if (!rpmFile.noRecursion) {
				if (rpmFile.filemode || rpmFile.username || rpmFile.groupname) {
					str += '%attr('
						+ optionalValue(rpmFile.filemode) + ','
						+ optionalValue(rpmFile.username) + ','
						+ optionalValue(rpmFile.groupname) + ') ';
				}
				if (rpmFile.orig.expand) {
					str += '"' + unixifyPath(path.join(path.sep, rpmFile.dest)) + '"\n';
				} else {
					str += '"' + unixifyPath(path.join(path.sep, rpmFile.dest, rpmFile.path)) + '"\n';
				}
//			} else {
//				str += '%dir "' + unixifyPath(path.join(path.sep, rpmFile.dest + rpmFile.path)) + '"\n';
//			}
		}
	}

	return str;
}

function readScriptlet(label, scriptFile) {
	var src = '';
	if (scriptFile) {
		var options = {
			encoding: scriptFile.encoding || 'utf8'
		};
		var data = fs.readFileSync(scriptFile.src, options);
		src += label + '\n';
		src += data.trim() + '\n\n';
	}
	return src;
}

function skipBinariesInNoarchPackageError() {
	return '%define _binaries_in_noarch_packages_terminate_build   0\n\n';
}

/**
 * Provides utility methods to execute a command
 * @module exec
 */
module.exports = function(options, callback) {
//	grunt.verbose.writeln('Writing SPEC basic section...');

	// FIXME the following macro definition should not be needed if the --define command line parameter is taken into account by rpmbuild
	var src = '%define   _topdir ' + path.join(process.cwd(), options.destination) + '\n\n';

	src += skipBinariesInNoarchPackageError();

	src += formatField('Name', options.name);
	src += formatField('Version', options.version);
	src += 'Release: ';
        if (options.release === true) {
                src += '1\n';
        } else if (options.release) {
                src += options.release + '\n';
	} else {
		src += 'SNAPSHOT' + formatTimestamp(new Date()) + '\n';
	}

	src += formatField('URL', options.homepage);
	src += formatField('Summary', options.summary);
	src += formatField('License', optionalValue(options.license, options.licenses && options.licenses[0] && options.licenses[0].type));
	src += formatField('Distribution', options.distribution);
	src += formatField('Vendor', options.vendor);
	src += formatField('Group', options.group);
	src += formatField('Provides', options.provides);
	src += formatLabeledList('Requires', options.requires);
	src += formatField('autoprov', 'yes');
	src += formatField('autoreq', 'yes');
	src += formatField('\n%description', options.description, '\n');

//	grunt.verbose.writeln('Writing SPEC files section...');
	src += formatFileList(options);

//	grunt.verbose.writeln('Writing SPEC scriptlet section...');
	src += readScriptlet('\n%pre', options.preInstall);
	src += readScriptlet('\n%post', options.postInstall);
	src += readScriptlet('\n%preun', options.preUninstall);
	src += readScriptlet('\n%postun', options.postUninstall);

	fs.writeFile(options.specFilepath, src, callback);
};
