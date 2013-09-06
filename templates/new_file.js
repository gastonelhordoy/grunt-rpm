/**
 * New node file
 */

var swig = require('swig');
var fs = require('fs.extra');
var path = require('path');
var pkg = require('../package.json');

var options = {
	buildDir: '/opt/test',
	summary: 'something to say about the rpm package',
	requires: ['mulebot-commands >= 1.0.0', 'mulebot = 1.3'],
	release: false,
	license: 'MIT',
	defaultUsername: 'videof',
	files: [{
		path: '/opt/test1/test',
		noRecursion: true
	}, {
		path: '/opt/test1/tasks',
	}, {
		path: '/opt/test1/templates/spec.tmpl',
		groupname: 'root'
	}]
};

function createRpmDir(subfolder) {
	fs.mkdir(path.join(options.buildDir, subfolder));
}

createRpmDir('BUILD');
createRpmDir('RPMS');
createRpmDir('SOURCES');
createRpmDir('SPECS');
createRpmDir('SRPMS');
createRpmDir('tmp-buildroot');
createRpmDir('buildroot');

swig.renderFile('./spec.tmpl', {pkg: pkg, rpm: options}, function (err, output) {
	if (err) throw err;
	console.log('Template processed');

	fs.writeFile(path.join(options.buildDir, 'SPECS', 'grunt-rpm-test.spec'), output, function(err) {
		if (err) throw err;
		console.log('Spec saved');
		
// rpmbuild -bb --buildroot options.buildDir + '/buildroot' --define='_topdir ' + options.buildDir 
// rpmbuild -bb --buildroot '/opt/test/buildroot' --define='_topdir /opt/test' '/opt/test/SPECS/grunt-rpm-test.spec'
	});
});