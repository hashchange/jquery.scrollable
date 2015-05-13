# jQuery.scrollable

THIS COMPONENT IS IN ITS EARLY STAGES. STAY CLEAR FOR NOW.

## Dependencies and setup

jQuery.scrollable depends on [jQuery][] and [jQuery.documentSize][]. They must be ready for use when jquery.scrollable.js is loaded.

The stable version of jQuery.scrollable is available in the `dist` directory ([dev][dist-dev], [prod][dist-prod]), including an AMD build ([dev][dist-amd-dev], [prod][dist-amd-prod]). If you use Bower, fetch the files with `bower install jquery.scrollable`. With npm, it is `npm install jquery.scrollable`.

## Components

## Usage and examples

### The basics

### Options

## Build process and tests

If you'd like to fix, customize or otherwise improve the project: here are your tools.

### Setup

[npm][] and [Bower][] set up the environment for you. 

- The only thing you've got to have on your machine is [Node.js]. Download the installer [here][Node.js].
- Open a command prompt in the project directory.
- Run `npm install`. (Creates the environment.)
- Run `bower install`. (Fetches the dependencies of the script.)

Your test and build environment is ready now. If you want to test against specific versions of Backbone, edit `bower.json` first.

### Running tests, creating a new build

#### Considerations for testing

To run the tests on remote clients (e.g. mobile devices), start a web server with `grunt interactive` and visit `http://[your-host-ip]:9400/web-mocha/` with the client browser. Running the tests in a browser like this is slow, so it might make sense to disable the power-save/sleep/auto-lock timeout on mobile devices. Use `grunt test` (see below) for faster local testing.

#### Tool chain and commands

The test tool chain: [Grunt][] (task runner), [Karma][] (test runner), [Jasmine][] (test framework). But you don't really need to worry about any of this.

A handful of commands manage everything for you:

- Run the tests in a terminal with `grunt test`.
- Run the tests in a browser interactively, live-reloading the page when the source or the tests change: `grunt interactive`.
- If the live reload bothers you, you can also run the tests in a browser without it: `grunt webtest`.
- Run the linter only with `grunt lint` or `grunt hint`. (The linter is part of `grunt test` as well.)
- Build the dist files (also running tests and linter) with `grunt build`, or just `grunt`.
- Build continuously on every save with `grunt ci`.
- Change the version number throughout the project with `grunt setver --to=1.2.3`. Or just increment the revision with `grunt setver --inc`. (Remember to rebuild the project with `grunt` afterwards.)
- `grunt getver` will quickly tell you which version you are at.

Finally, if need be, you can set up a quick demo page to play with the code. First, edit the files in the `demo` directory. Then display `demo/index.html`, live-reloading your changes to the code or the page, with `grunt demo`. Libraries needed for the demo/playground should go into the Bower dev dependencies, in the project-wide `bower.json`, or else be managed by the dedicated `bower.json` in the demo directory.

_The `grunt interactive` and `grunt demo` commands spin up a web server, opening up the **whole project** to access via http._ So please be aware of the security implications. You can restrict that access to localhost in `Gruntfile.js` if you just use browsers on your machine.

### Changing the tool chain configuration

In case anything about the test and build process needs to be changed, have a look at the following config files:

- `karma.conf.js` (changes to dependencies, additional test frameworks)
- `Gruntfile.js`  (changes to the whole process)
- `web-mocha/_index.html` (changes to dependencies, additional test frameworks)

New test files in the `spec` directory are picked up automatically, no need to edit the configuration for that.

## License

MIT.

Copyright (c) 2015 Michael Heim.

// todo review, has the test helper been used?
Code in the data provider test helper: (c) 2014 Box, Inc., Apache 2.0 license. [See file][data-provider.js].

[dist-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.js "jquery.scrollable.js"
[dist-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.min.js "jquery.scrollable.min.js"
[dist-amd-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.js "jquery.scrollable.js, AMD build"
[dist-amd-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.min.js "jquery.scrollable.min.js, AMD build"

[jQuery]: http://jquery.com/ "jQuery"
[jQuery.documentSize]: https://github.com/hashchange/jquery.documentsize "jQuery.documentSize"

[data-provider.js]: https://github.com/hashchange/jquery.scrollable/blob/master/spec/helpers/data-provider.js "Source code of data-provider.js"

[Backbone]: http://backbonejs.org/ "Backbone.js"
[Node.js]: http://nodejs.org/ "Node.js"
[Bower]: http://bower.io/ "Bower: a package manager for the web"
[npm]: https://npmjs.org/ "npm: Node Packaged Modules"
[Grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner"
[Karma]: http://karma-runner.github.io/ "Karma - Spectacular Test Runner for Javascript"
[Jasmine]: http://jasmine.github.io/ "Jasmine: Behavior-Driven JavaScript"
[JSHint]: http://www.jshint.com/ "JSHint, a JavaScript Code Quality Tool"