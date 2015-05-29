# jQuery.scrollable

 jQuery.scrollable manages animated scrolling in windows, scrollable elements and iframes. It frees you from handling gotchas and edge cases and offers convenient, flexible options for animation.

## Dependencies and setup

jQuery.scrollable depends on [jQuery][] and [jQuery.documentSize][]. They must be ready for use when jquery.scrollable.js is loaded.

The stable version of jQuery.scrollable is available in the `dist` directory ([dev][dist-dev], [prod][dist-prod]), including an AMD build ([dev][dist-amd-dev], [prod][dist-amd-prod]). If you use Bower, fetch the files with `bower install jquery.scrollable`. With npm, it is `npm install jquery.scrollable`.

## Why?

On the face of it, animated scrolling is such a trivial task with jQuery that you'd be forgiven to think a plugin is foolish. Doesn't a one liner get you there? Is a call along the lines of `$elem.animate( { scrollTop: 1200 } )` not enough?

Yes. And no - because you'll soon discover that your animations end rather abruptly when your target position is beyond the scrollable distance, so you need to check and adjust for that. And then, the most common object to scroll is `window`, which unfortunately can't be scrolled with `animate`. Turns out you need to target either `body` or `documentElement`, depending on the browser.

Now you suddenly have to feature-test the browser for the right element, which involves injecting a test iframe that needs to be [designed rather carefully][so-comment-iframe-setup]. Or else you can animate both elements, with `$( "html, body" ).animate(...)`, which sounds great until you use animation callbacks (`complete`, `step` etc). They fire twice as often as they should because you animated two elements rather than one, so you find yourself filtering callback calls, which isn't [quite as easy][so-comment-callback-filtering] as it looks at first glance, and ... I'll stop here. You get the picture.

And we haven't even started implementing convenience options, or moved scrolling to a dedicated animation queue so as not to interfere with other animations on the page, and so on.

See? That's why you get a plugin for such a trivial task. 

## OK. How?

It's super simple.

#### Scrolling to a fixed position, vertically

The most common use case. Plenty of ways to do it, all equally valid.

```js
// For vertical scrolling, you don't have to specify an axis...
$elem.scrollTo( 1200 );
$elem.scrollTo( "1200" );
$elem.scrollTo( "1200px" );

// ...but you can. Either as part of the position...
$elem.scrollTo( { top: 1200 } );
$elem.scrollTo( { y: 1200 } );
$elem.scrollTo( { vertical: 1200 } );
$elem.scrollTo( { v: 1200 } );

// ...or with a separate axis option.
$elem.scrollTo( 1200, { axis: "y" );
$elem.scrollTo( 1200, { axis: "vertical" );
$elem.scrollTo( 1200, { axis: "v" );
```

As you can see, the **vertical axis names** `top`, `y`, `vertical`, and `v` can be used interchangeably. And of course, if the target position is beyond the maximum scroll range, it is adjusted automatically to ensure a smooth animation.

You can also use **percentages**. Suppose you want to scroll half way down the page:

```js
$elem.scrollTo( "50%" );
```

And you can use **keywords**.

```js
$elem.scrollTo( "top" );      // same as 0
$elem.scrollTo( "bottom" );   // same as "100%"
```

### Scrolling to a fixed position, horizontally

Works exactly the same as vertical scrolling, but you have to be explicit about the axis.

```js
// You have to specify the axis here, as part of the position...
$elem.scrollTo( { left: 800 } );
$elem.scrollTo( { x: 800 } );
$elem.scrollTo( { horizontal: 800 } );
$elem.scrollTo( { h: 800 } );

// ...or with the axis option.
$elem.scrollTo( 1200, { axis: "x" );
$elem.scrollTo( 1200, { axis: "horizontal" );
$elem.scrollTo( 1200, { axis: "h" );
```

**Horizontal axis names** are `left`, `x`, `horizontal`, and `h`. Use what suits you best.

Again, you can also use **percentages** and **keywords**.

```js
$elem.scrollTo( { x: "50%" } );
$elem.scrollTo( { x: "left" } );   // same as 0
$elem.scrollTo( { x: "right" } );  // same as "100%"

// You can omit the axis if it is obvious from the target
$elem.scrollTo( "left" );
$elem.scrollTo( "right" );
```

### Scrolling to a fixed position on both axes

By default, both axes **scroll simultaneously**. The pane moves diagonally.

```js
$elem.scrollTo( { x: 800, y: 1200 } );  // or any of the other axis labels and units
```

But you can **chain the movements**, too. In the example below, you scroll vertically first, and when the target is reached, the horizontal movement follows.

```js
$elem
    .scrollTo( { y: 1200 } )
    .scrollTo( { x: 800 }, { append: true } );
```

When chaining scroll movements, the `append` option does the trick. Normally, when you call `scrollTo()`, a previous, ongoing scroll animation is stopped in its tracks and replaced by the new one. With `append: true`, you can prevent that and queue your scroll movements. 

### Relative scrolling

You can scroll relative to the current scroll position. Prefix the intended shift with `"+="` or `"-="`.

Suppose you want to move another 100px down the page from where you are now:

```js
$elem.scrollTo( "+=100" );
$elem.scrollTo( "+=100px" );
```

It also works with percentages. Let's scroll left by 25%:

```js
$elem.scrollTo( { x: "-=25%" } );
```

This scrolls 25% of the _total_ scroll range in `$elem`. If you are closer than that to the left edge, the amount is reduced accordingly.

### Stopping scroll animations

Scroll animations run in their own, dedicated queue, so they don't interfere with other animations which may be going on at the same time. As a result, you can't and shouldn't stop scroll movements with the [generic jQuery `$elem.stop()` command][jquery-stop]. Use `$elem.stopScroll()` instead:

```js
$elem.stopScroll();
$elem.stopScroll( { jumpToTargetPosition: true } );
```

With the option `jumpToTargetPosition`, the window or container element jumps to the target position as the animation is aborted. By default, the scroll animation just stops wherever it happens to be.

Calling `stopScroll()` also removes queued scroll animations, should there be any. But it does not affect other, non-scroll animations and their queues - they proceed as normal.

Please be aware that **you don't have to call `stopScroll()` before scrolling into a new direction**, ie when you call `scrollTo()` on the same container (e.g. the window). Ongoing scroll movements are stopped automatically for you.

Rather, you have to act if you _don't_ want to stop the current scroll movement and put the new one in the queue instead. Use the `append` option then ([see above][scrolling-both-axes]).

### Animation options

Besides `axis` and `append`, you can use [every option available to `jQuery.animate()`][jQuery-animate]. Set up `progress` or `complete` callbacks, specify a `duration` etc. Add what you need to the options object that you pass to `scrollTo()`:

```js
$elem.scrollTo( 1200, { axis: "x", duration: 800 );
```

### Custom queues

If you want to get really fancy with your animations, you can merge scrolling and other animations in a custom queue, but in most cases you shouldn't.

Sure enough, you can pass a custom queue name to `scrollTo()`, in standard jQuery fashion with the `queue` option. If you do and you ever call `stopScroll()`, you need to provide the same queue name there, too. Again, it is an option - call `$elem.stopScroll( { queue: "foo" } )`.

But in that custom queue, it is no longer possible to differentiate between scroll and non-scroll animations. A new invocation of `scrollTo()` stops _all_ animations in that queue, regardless of type, unless you use the `append` option (in which case nothing stops at all). And `stopScroll()` works just the same as [jQuery's `$elem.stop( true )`][jquery-stop].

My advice would be to stick to the standard scroll queue as a best practice - ie, simply don't specify a queue, and all will be well. Manage that queue implicitly with the `append` option of `scrollTo()`, or perhaps call `stopScroll()` explicitly when really necessary, and leave it at that. If you need to link up with other, non-scroll animations, callbacks like `complete` give you the means to do so.

### Getting the scrollable element

Well, finally there is the method which gave the plugin its name. A call to `$elem.scrollable()` returns the element - or set of elements - used for the scroll animation.

For an ordinary HTML element, that is the element itself. The only even remotely interesting use case is for `body`/`html`/`window`, where `scrollable()` returns either a jQuery set consisting of both `body` and `documentElement` (current implementation), or just one of them - the one which truly is the correct one to animate (alternative implementation, based on feature testing, but not used at the moment).

## Build process and tests

If you'd like to fix, customize or otherwise improve the project: here are your tools.

### Setup

[npm][] and [Bower][] set up the environment for you. 

- The only thing you've got to have on your machine is [Node.js]. Download the installer [here][Node.js].
- Open a command prompt in the project directory.
- Run `npm install`. (Creates the environment.)
- Run `bower install`. (Fetches the dependencies of the script.)

Your test and build environment is ready now. If you want to test against specific versions of jQuery, edit `bower.json` first.

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

[dist-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.js "jquery.scrollable.js"
[dist-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.min.js "jquery.scrollable.min.js"
[dist-amd-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.js "jquery.scrollable.js, AMD build"
[dist-amd-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.min.js "jquery.scrollable.min.js, AMD build"

[jQuery]: http://jquery.com/ "jQuery"
[jQuery.documentSize]: https://github.com/hashchange/jquery.documentsize "jQuery.documentSize"

[so-comment-iframe-setup]: http://stackoverflow.com/questions/8149155/animate-scrolltop-not-working-in-firefox/21583714#comment46979441_21583714 "Stack Overflow: Animate scrollTop not working in firefox - Comment by @hashchange"
[so-comment-callback-filtering]: http://stackoverflow.com/questions/8790752/callback-of-animate-gets-called-twice-jquery/8791175#comment48499212_8791175 "Stack Overflow: Callback of .animate() gets called twice jquery - Comment by @hashchange"
[jQuery-animate]: http://api.jquery.com/animate/ "jQuery API Documentation: .animate()"
[jquery-stop]: http://api.jquery.com/stop/ "jQuery API Documentation: .stop()"

[scrolling-both-axes]: #scrolling-to-a-fixed-position-on-both-axes

[Node.js]: http://nodejs.org/ "Node.js"
[Bower]: http://bower.io/ "Bower: a package manager for the web"
[npm]: https://npmjs.org/ "npm: Node Packaged Modules"
[Grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner"
[Karma]: http://karma-runner.github.io/ "Karma - Spectacular Test Runner for Javascript"
[Jasmine]: http://jasmine.github.io/ "Jasmine: Behavior-Driven JavaScript"
[JSHint]: http://www.jshint.com/ "JSHint, a JavaScript Code Quality Tool"
