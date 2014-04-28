grunt-rpm
=========

The grunt-rpm plugin allows sources to be packaged in an RPM for distribution. In addition to project artifacts, the RPM can contain other resources to be installed with the artifacts and scripts to be run while the package is being installed and removed. This plugin does not support the full range of features available to RPMs.

[![NPM](https://nodei.co/npm/grunt-rpm.png?downloads=true&stars=true)](https://nodei.co/npm/grunt-rpm/)

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-rpm --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-rpm');
```

This plugin also requires rpmbuild to be installed in the host where the task is going to run. This is the tool grunt-rpm will use to build RPMs from specfiles that are automatically generated. To check if it is installed, run the rpmbuild --showrc command. A large set of data should be displayed, enumerating details of the build environment that rpmbuild is using.

If the tool is not found, you can install it with yum by running the following command as root:
```shell
yum install rpm-build
```
Other useful commands that you might need while building RPMs files are:
```shell
yum install rpmlint
yum --nogpgcheck localinstall packagename.arch.rpm 
```
The first command checks if there are non-compliant aspects about your RPM.
The second one uses yum top install your RPM without the need to deploy it to a yum repository and re-index it.

More documentation can be found here:

http://www.rpm.org/max-rpm/index.html
http://wiki.centos.org/TipsAndTricks/YumAndRPM
http://wiki.centos.org/HowTos/SetupRpmBuildEnvironment
http://rpmbuildtut.wordpress.com/

Other useful resources somehow related to packing Node.js applications in general:

https://github.com/kazuhisya/nodejs-rpm
http://stackoverflow.com/questions/14084307/provide-node-js-webapp-key-in-hand
http://blog.nodejs.org/2012/02/27/managing-node-js-dependencies-with-shrinkwrap/

## The "rpm" task

### Overview
In your project's Gruntfile, add a section named `rpm` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  rpm: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
})
```

### Options

#### options.destination
Type: `String`
Default value: `'rpm'`

The directory where the rpm folder structure is generated.

#### options.name
Type: `String`
Default value: `package.name`

Your project's name, used in the `Name` field for the spec file.

#### options.version
Type: `String`
Default value: `package.version`

Your project's version, used in the `Version` field for the spec file.

#### options.release
Type: `Boolean`
Default value: `false`

Flag to indicate whether the generated RPM will be have a `Release` number set to `1` or to `SNAPSHOT+timestamp`.

#### options.homepage
Type: `String`
Default value: `package.homepage`

Your project's homepage, used in the `URL` field for the spec file.

#### options.summary
Type: `String`
Default value: (required)

Your project's summary, used in the `Summary` field for the spec file.

#### options.license
Type: `String`
Default value: `package.licenses[0].type`

Your project's license, used in the `License` field for the spec file.

#### options.distribution
Type: `String`
Default value: (optional)

The value for the `Distribution` field in the spec file.

#### options.vendor
Type: `String`
Default value: (optional)

The value for the `Vendor` field in the spec file.

#### options.group
Type: `String`
Default value: (optional)

The value for the `Group` field in the spec file.

#### options.requires
Type: `Array`
Default value: (optional)

The list of required RPMs and their versions. These is used for RPM dependencies filling the `Requires` list field in the spec file.

#### options.description
Type: `String`
Default value: `package.description`

Your project's license, used in the `Description` macro for the spec file.

#### options.defaultFilemode
Type: `String`
Default value: (optional)

The default file mode used for files that are being copied to the host as part of the installation process.

#### options.defaultUsername
Type: `String`
Default value: (optional)

The default user name used for files that are being copied to the host as part of the installation process.

#### options.defaultGroupname
Type: `String`
Default value: (optional)

The default group name used for files that are being copied to the host as part of the installation process.

#### options.defaultDirmode
Type: `String`
Default value: (optional)

The default dirmmode used for files that are being copied to the host as part of the installation process.

#### options.preInstall
Type: `Object`
Default value: (optional)

The script defined executes just before the package is to be installed.

#### options.postInstall
Type: `Object`
Default value: (optional)

The script defined executes after the package has been installed.


### Usage Examples

#### Default Options
In this example, only mandatory options are specified. This will create the rpmbuild folder structure inside the `rpm` sub-folder, create a spec file with most of the default configuration and generate the RPM for your application using values from the `package.json` file.

```js
grunt.initConfig({
  rpm: {
    options: {
        summary: 'Bot for automating repetitive tasks'
    },
    files: {
        '/opt/my/application': ['lib/**/*.js', 'node_modules/**/*', 'index.js', 'package.json']
    }
  }
})
```

#### Custom Options
In this example, custom options are specified and a more complex file format specification is used to completely customize the installation. Also different tasks are defined for showing the felxibility in configuration.

```js
var gruntPattern = path.join('node_modules', 'grunt');

grunt.initConfig({
  rpm: {
    options: {
        destination: 'target/rpm',
        defaultUsername: 'myuser',
        defaultGroupname: 'mygroup',
        summary: 'Bot for automating repetitive tasks',
        license: 'MIT',
        group: 'Applications/Productivity'
    },
    files: [
        {src: ['lib/**/*.js'], dest: '/opt/my/application', username: 'myuser1', groupname: 'mygroup'},
        {src: ['node_modules/**/*'], dest: '/opt/my/application', filter: function(filepath) {
            return !grunt.util._.startsWith(filepath, gruntPattern);
        }, username: 'myuser2', groupname: 'mygroup'},
        {src: ['index.js', 'package.json'], dest: '/opt/my/application'}
    ],
    snapshot: {
        options: {
            release: false
        }
    },
	release: {
        options: {
            release: true
        }	
    }
  }
})
```

In the last snippet 3 users and 1 group were configured for showing the different flavors of customization in terms of file ownership. The configuration was made with no particular deployment schema in mind.
Most of the configuration is still picked from the `package.json` file except for the `license` field which is explicitly set to `'MIT'`.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
