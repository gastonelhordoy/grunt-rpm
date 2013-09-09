grunt-rpm
=========

The grunt-rpm plugin allows sources to be packaged in an RPM for distribution. In addition to project artifacts, the RPM can contain other resources to be installed with the artifacts and scripts to be run while the package is being installed and removed. This plugin does not support the full range of features available to RPMs.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install rpm --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('rpm');
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

Most documentation can be found here:
http://www.rpm.org/max-rpm/index.html
http://wiki.centos.org/TipsAndTricks/YumAndRPM
http://rpmbuildtut.wordpress.com/

[root@hostname ~]# yum install rpm-build 

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

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  rpm: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  rpm: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
})
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
