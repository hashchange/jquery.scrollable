# jQuery.scrollable

<small>[Setup][setup] – [Why?][why] – [Usage][usage] – [Browser support][browsers] – [Build and test][build]</small>

jQuery.scrollable manages animated scrolling in windows, scrollable elements and iframes. It frees you from handling gotchas and edge cases and offers convenient, flexible options for animation.

## Dependencies and setup

jQuery.scrollable depends on [jQuery][] and [jQuery.documentSize][]. They must be ready for use when jquery.scrollable.js is loaded.

The stable version of jQuery.scrollable is available in the `dist` directory ([dev][dist-dev], [prod][dist-prod]), including an AMD build ([dev][dist-amd-dev], [prod][dist-amd-prod]). If you use Bower, fetch the files with `bower install jquery.scrollable`. With npm, it is `npm install jquery.scrollable`.

## Why?

On the face of it, animated scrolling is such a trivial task with jQuery that you'd be forgiven to think a plugin is foolish. Doesn't a one liner get you there? Is a call along the lines of `$elem.animate( { scrollTop: 1200 } )` not enough?

Yes. And no – because you'll soon discover that your animations end rather abruptly when your target position is beyond the scrollable distance, so you need to check and adjust for that. And then, the most common object to scroll is `window`, which unfortunately can't be scrolled with `animate`. Turns out you need to target either `body` or `documentElement`, depending on the browser.

Now you suddenly have to feature-test the browser for the right element, which involves injecting a test iframe that needs to be [designed rather carefully][so-comment-iframe-setup]. Or else you can animate both elements, with `$( "html, body" ).animate(...)`, which sounds great until you use animation callbacks (`complete`, `step` etc). They fire twice as often as they should because you animated two elements rather than one, so you find yourself filtering callback calls, which isn't [quite as easy][so-comment-callback-filtering] as it looks at first glance, and ... I'll stop here. You get the picture.

And that's just the basic animation. We haven't even started implementing [convenience][scrolling-both-axes] [options][relative-scrolling], handled [overlapping calls][overlapping-calls], or moved scrolling to a [dedicated animation queue][stopping] so as not to interfere with other animations on the page. We still need to address that animations [turn into a crawl][minimum-speed] when covering short distances. Worst of all, we ignore user interaction and fail to [stop an ongoing scroll animation][user-interaction] if the user taps, clicks, or scrolls, which we definitely should in most cases.

See? That's why you get a plugin for such a trivial task. 

## OK. How?

It's super simple. And it gives you a lot of flexibility.

<small>[Window scrolling][window-scrolling] – [Absolute target][absolute-scrolling] – [Relative target][relative-scrolling]</small>
<small>[Overlapping calls][overlapping-calls] – [Minimum speed][minimum-speed] – [User interaction][user-interaction] – [Options][animation-options]</small>
<small>[Stopping][stopping] – [Custom queues][custom-queues] – [Scrollable distance][scrollable-distance] – [Scrollable element][scrollable-element]</small>

### Scrolling a window

For scrolling the window, call `scrollTo` on any object which would come to mind:

```js
$( window ).scrollTo( 1200 );     // scrolls the window
$( "body" ).scrollTo( 1200 );     // scrolls the window
$( "html" ).scrollTo( 1200 );     // scrolls the window
$( document ).scrollTo( 1200 );   // scrolls the window
``` 

Likewise for an iframe (provided you are allowed access to its content). You can also call `scrollTo` on the iframe element itself.

```js
$iframeElement.scrollTo( 1200 );  // scrolls the iframe window
``` 

### Scrolling to a fixed position, vertically

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
$elem.scrollTo( 1200, { axis: "y" } );
$elem.scrollTo( 1200, { axis: "vertical" } );
$elem.scrollTo( 1200, { axis: "v" } );
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
$elem.scrollTo( 1200, { axis: "x" } );
$elem.scrollTo( 1200, { axis: "horizontal" } );
$elem.scrollTo( 1200, { axis: "h" } );
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

### Starting a scroll movement while another one is still in progress

In an event-driven system, `scrollTo` calls can overlap. Suppose a scroll animation is triggered while another one is still in progress. What happens next? You have a choice.

- **Replace** mode (default):

  The new `scrollTo` call cancels preceding ones. An ongoing scroll movement is stopped in its tracks immediately, and the new animation starts from there. [Relative scroll movements][relative-scrolling] are based on that location.

  This is what happens by default.

- **Append** mode:

  The new scroll animation is queued and executes when the preceding ones have finished.

  You get this behaviour with the `append` option: `$elem.scrollTo( "+=100", { append: true } )`. [See above.][scrolling-both-axes]

- **Merge** mode:

  The new scroll animation replaces preceding ones, taking their target positions into account. 

  Preceding `scrollTo` calls are cancelled, an ongoing animation is stopped, and a new scroll movement is started.  The targets of preceding scroll movements are merged into the new one. In case of a conflict, the last target  position wins. (Conflicts are resolved for each axis individually.)

  Suppose an animation is in the process of scrolling down to the middle of the page. Now, a new scroll animation should move the page down another 25%, and to the right by 50%. In merge mode, the ongoing scroll movement is stopped, and a new one initiated which will end up 75% down the page, and 50% to the right.
 
  You get this type of behaviour with the `merge` option: `$elem.scrollTo( "+=100", { merge: true } )`.

##### Which callbacks are called?

In **replace** mode and **merge** mode, preceding animations are cancelled when a new one comes along. 

If an animation is cancelled while it is in progress, its `fail` and `always` callbacks run. However, if an animation is cancelled while it is still waiting in the queue, it simply disappears, and none of its callbacks are called.

In **append** mode, preceding animations always run their course, and their callbacks are called as usual.

##### What happens if the new call is redundant because it aims for the same position?

If `scrollTo` targets the exact same position it starts from, the call is ignored. There is no animation, and animation callbacks don't run, either. This policy manifests itself in a number of ways, with subtle differences.

- The first case is obvious. Suppose the browser is at rest, without another scroll animation in progress. If a `scrollTo` call is targeting a position which has already been reached, the call is ignored. The scroll mode (replace, append, merge) does not matter in this case.

- Now suppose another scroll movement is in progress when `scrollTo` is called. In **append** or **merge** mode, the new movement is compared to ongoing and queued animations. If those animations end up in the position which the new `scrollTo` call is aiming for, the new call is ignored.

  Example: 

  ```js
  $elem.scrollTo( 150 )
       .scrollTo( "-=50", { append: true } )  // queued, ending up 100px from the top
       .scrollTo( 100, { append: true } );    // same target, call is ignored
  ```

- In **replace** mode, things are different. If a scroll animation is under way when `scrollTo` is called with the same target, the original animation is stopped (replaced), and a new animation begins, completing the move.

  If you don't want that to happen and rather have the original animation complete uninterrupted, use merge mode instead.

### Minimum speed

Animations run with a fixed duration. That works fine for all sorts of transitions, but it doesn't work that well for scrolling.

##### Default minimum speed

Consider a scroll animation which takes 400ms to complete. If the initial scroll position is a fair distance away from the scroll target, the user will see a swift move. But if the position happens to be very close to the target to begin with, 400ms is a long time. The scroll animation is reduced to a crawl.

That's why `scrollTo` shortens the duration of the animation when the initial position is close to the target. The adjustment kicks in at a **distance of 400px** or less. Below that threshold, the speed of the animation is prevented from falling further and kept constant instead. 

The default behaviour is subtle and feels natural, but of course you can tweak it or turn it off.

##### Customization

You can change the default threshold of 400px with the option `lockSpeedBelow`. 

Use it to modify the threshold for an individual `scrollTo` call:
 
```js
$elem.scrollTo( "50%", { lockSpeedBelow: 200 } );  // constant speed if less than 200px away
```

You can also change the default globally: `$.scrollable.lockSpeedBelow = 200`. 

The threshold is specified in pixels, either as a number, or as a string that evaluates to a number (`"200px"`). A low threshold honours your duration setting even if the initial distance is short, allowing animations to become very slow. A threshold of 0 turns the **minimum speed off**. You can also set the threshold to a falsy value or any non-numeric string, such as a descriptive `"off"`.

A larger threshold means a larger zone of constant speed, and larger variations in scroll duration. You can even enforce a **constant speed throughout**. To achieve that, make the threshold at least as large as the maximum distance that can be scrolled. Then tweak the speed indirectly: by changing the nominal `duration` (speed = threshold / duration). 

### Aborting when the user scrolls, clicks, or taps

An animation initiated by `scrollTo` is automatically stopped as soon as

- the user scrolls
- the user holds down a mouse button, clicks, or double-clicks in the scrolling area
- the user touches the screen in the scrolling area, in a touch-enabled device.

That way, the actions of the user are respected. They take precedence over automated animations.

##### Exceptions for selected elements

Occasionally, you might want to allow clicking or tapping on a few selected elements – controls with a fixed position, for instance – without stopping the scroll animation. That is easy to do. 

The click and touch detection responds to `mousedown`, `touchstart` and `pointerdown` events. In order to keep the scroll animation running, you just have to prevent these events from bubbling up to the scroll container. Add an event handler to your controls which does just that:
 
```js
$controls.on( "mousedown touchstart pointerdown", function ( event ) { 
    event.stopPropagation(); 
} );
```

Of course, you only need to do this if the controls are children of the scroll container.

##### Ignoring the user

You can override the built-in detection of user actions and force your scroll movement to proceed with the `ignoreUser` option: `$elem.scrollTo( 100, { ignoreUser: true } )`. And yes, that option name is chosen deliberately to make you cringe when you type it. 

If you need to be more specific, use `ignoreUser: "click"` to ignore clicks and touch only. The scroll animation still stops when the user scrolls. Alternatively, you can ignore scrolling, but respond to clicks and touch, with `ignoreUser: "scroll"`.

It should be said, though, that overriding the user's intent in this way is a bad idea (tm) in almost every case. Use `ignoreUser` judiciously.

##### Tweaking the user scroll detection

A scroll animation is aborted when the user has tried to scroll by more than 10px, in any direction. Below that threshold, user scrolling is considered to be accidental and insufficient to signal intent.

You can tweak that threshold, even though there hardly ever is any need to do so. The default setting is stored in a global, which you can modify: `$.scrollable.userScrollThreshold = 50`. You can also set the threshold for an individual animation with the `userScrollThreshold` option: `$elem.scrollTo( 1000, { userScrollThreshold: 50 }`. 

The minimum value for the threshold is 5.

### Animation options

We have already [talked about][overlapping-calls] the options `axis`, `append`, and `merge`. We have covered how to [set a minimum speed][minimum-speed] with `lockSpeedBelow`, and discussed how to fine-tune the response to user interaction with [with `ignoreUser`][ignoring-the-user] and the [`userScrollThreshold` option][tweaking-scroll-detection].

In addition to these, you can use [every option available to `jQuery.animate()`][jQuery-animate]. Set up `progress` or `complete` callbacks, specify a `duration` etc. Add what you need to the options object which you pass to `scrollTo()`:

```js
$elem.scrollTo( 1200, { axis: "x", duration: 800 );
```

##### A note on callbacks

In jQuery fashion, animation callbacks such as `start`, `complete`, etc are bound to the animated element. 

But there is an exception: window scroll animations are bound to the appropriate `window`. Ie, inside the callbacks, the `this` keyword represents the window object, not the real scrollable element (`documentElement` or `body`).

### Stopping scroll animations

Scroll animations run in their own, dedicated queue, so they don't interfere with other animations which may be going on at the same time. As a result, you can't and shouldn't stop scroll movements with the [generic jQuery `$elem.stop()` command][jquery-stop]. 

Use `$elem.stopScroll()` instead:

```js
$elem.stopScroll();
$elem.stopScroll( { jumpToTargetPosition: true } );
```

With the option `jumpToTargetPosition`, the window or container element jumps to the target position as the animation is aborted. By default, the scroll animation just stops wherever it happens to be.

Calling `stopScroll()` also removes queued scroll animations, should there be any. But non-scroll animations and their queues are not affected – they proceed as normal.

**Important: You don't need to use `stopScroll()` when calling `scrollTo()` repeatedly**. 

When you call `scrollTo()` multiple times on the same container (e.g. the window), ongoing scroll movements are stopped automatically for you. In fact, you have to act if you _don't_ want to stop the current scroll movement. Use the `append` option then ([see above][scrolling-both-axes]).

### Custom queues

As already [mentioned above][stopping], scroll animations run in their own, dedicated queue, so they don't interfere with other animations which may be going on at the same time. That all happens behind the scenes, and you don't have to do anything to manage that process.  

However, if you want to get really fancy with your animations, you can merge scrolling and other animations in a custom queue of your own. But in most cases, you shouldn't.

Sure enough, you can pass a custom queue name to `scrollTo()`. That is done in standard jQuery fashion: with the `queue` option. If you use it and you ever call `stopScroll()`, you need to provide the same queue name there, too. Call it like this: `$elem.stopScroll( { queue: "foo" } )`.

But that flexibility comes at a price. In a custom queue of your own, it is no longer possible to differentiate between scroll and non-scroll animations. When you run `scrollTo()`, it stops _all_ animations in that queue, regardless of type, unless you use [the `append` option][scrolling-both-axes] (in which case nothing stops at all). And `stopScroll()` now works just the same as [jQuery's `$elem.stop( true )`][jquery-stop].

My advice would be to stick to the standard scroll queue as a best practice – ie, simply don't specify a queue, and all will be well. Manage that queue implicitly with the [`append` and `merge` options][overlapping-calls] of `scrollTo()`, or perhaps call `stopScroll()` explicitly when really necessary, and leave it at that. 

If you need to link up with other, non-scroll animations, [callbacks like `complete`][jQuery-animate-options] give you the means to do so.

### Retrieving the maximum scrollable distance within an element

You can query the maximum distance that the content of an element can be scrolled, in case you need it for some calculations of your own. That value is the size of the content minus the inner size of the element or window. 

Coming up with that value is an easy task, but there are some pitfalls when dealing with a window in particular. Hence there is `$elem.scrollRange()`, which takes care of the quirks.

```js
// For a single axis, scrollRange() returns a number
v = $elem.scrollRange( "vertical" );
v = $elem.scrollRange( "v" );
v = $elem.scrollRange( "y" );

h = $elem.scrollRange( "horizontal" );
h = $elem.scrollRange( "h" );
h = $elem.scrollRange( "x" );

// For both axes, scrollRange() returns a hash of the results
// in the format { vertical: ..., horizontal: ... }
hash = $elem.scrollRange( "both" );
hash = $elem.scrollRange( "all" );
hash = $elem.scrollRange( "vh" );   // or "hv"
hash = $elem.scrollRange( "xy" );   // or "yx"

// When called without an axis argument, scrollRange() defaults 
// to both axes and returns a hash
hash = $elem.scrollRange();
```

As always, you can use the vertical axis names `"vertical"`, `"v"`, `"y"` interchangeably. For the horizontal axis, `"horizontal"`, `"h"` and `"x"` are equally valid. For both axes at once, you can use `"both"`, `"all"`, `"vh"` or `"hv"`, `"xy"` or `"yx"`, or you can just omit the axis argument altogether.

Please remember that despite all that flexibility with names during input, when the result is returned as a hash, its properties are named `horizontal` and `vertical`.

### Getting the scrollable element

Well, finally there is the method which gave the plugin its name. A call to `$elem.scrollable()` returns the element used for the scroll animation. 

- When called on an ordinary HTML element, the result is uninteresting – all you get back is the element itself.
- For `document`/`body`/`html`/`window`, either `body` or `documentElement` is returned, depending on the browser. 
- When called on an iframe element, you get the scrollable element for content window.

The result is wrapped in a jQuery object.

It should go without saying that the result is established with feature testing, not browser sniffing, and is based on the actual behaviour of the browser.

## Browser support

jQuery.scrollable has been tested with 

- 2015 versions of Chrome, Firefox, Safari, and Opera on the Desktop
- IE8+
- Safari on iOS 8, Chrome on Android 5
- SlimerJS

IE8 can't hande the heavily asynchronous character of the unit tests. It has been tested manually instead, using the [AMD demo][tool-chain-commands] (run it with `grunt demo`).

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

## Release Notes

### v1.1.0

- Fixed the issue of slow animations when scroll distance is short, by introducing a default minimum speed
- Added `lockSpeedBelow` option and global `$.scrollable.lockSpeedBelow` setting

### v1.0.0

- Made scroll animations abort automatically when the user clicks or taps
- Added `ignoreUser` option

### v0.4.0

- Made scroll animations abort automatically when the user scrolls
- Added global `$.scrollable.userScrollThreshold` setting, `userScrollThreshold` option
- Fixed detection of alternative axis names in `axis` option
- Fixed miscalculation of relative positions in append, merge mode

### v0.3.1

- Made scrollTo skip redundant animations (start and target positions being the same)

### v0.3.0

- Added merge mode
- Enabled use of merge, append modes in any queue
- Fleshed out the test suite

### v0.2.1

- Got rid of queue reordering in favour of info entries on sentinels
- Reorganized the plugin code

### v0.2.0

- Switched cores, now using feature testing
- Improved demo

### v0.1.2

- Fixed appended animations with relative targets
- Fixed $.fn.scrollRange(), added default for axis argument
- Improved readme, demo

### v0.1.1

- Made axis specification obsolete when target is obvious
- Removed auto start for user-defined custom queues
- Fixed readme

### v0.1.0

- Initial development, documentation, demo

## License

MIT.

Copyright (c) 2015 Michael Heim.

[dist-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.js "jquery.scrollable.js"
[dist-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.min.js "jquery.scrollable.min.js"
[dist-amd-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.js "jquery.scrollable.js, AMD build"
[dist-amd-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.min.js "jquery.scrollable.min.js, AMD build"

[jQuery]: http://jquery.com/ "jQuery"
[jQuery.documentSize]: https://github.com/hashchange/jquery.documentsize "jQuery.documentSize"

[so-comment-iframe-setup]: http://stackoverflow.com/questions/8149155/animate-scrolltop-not-working-in-firefox/21583714#comment46979441_21583714 "Stack Overflow: Animate scrollTop not working in firefox – Comment by @hashchange"
[so-comment-callback-filtering]: http://stackoverflow.com/questions/8790752/callback-of-animate-gets-called-twice-jquery/8791175#comment48499212_8791175 "Stack Overflow: Callback of .animate() gets called twice jquery – Comment by @hashchange"
[jQuery-animate]: http://api.jquery.com/animate/ "jQuery API Documentation: .animate()"
[jQuery-animate-options]: http://api.jquery.com/animate/#animate-properties-options "jQuery API Documentation: .animate() with an options argument"
[jquery-stop]: http://api.jquery.com/stop/ "jQuery API Documentation: .stop()"

[setup]: #dependencies-and-setup "Dependencies and setup"
[why]: #why "Why use it?"
[usage]: #ok-how "How to use it"
[window-scrolling]: #scrolling-a-window "Scrolling a window"
[absolute-scrolling]: #scrolling-to-a-fixed-position-vertically "Scrolling to a fixed position"
[relative-scrolling]: #relative-scrolling "Relative scrolling"
[overlapping-calls]: #starting-a-scroll-movement-while-another-one-is-still-in-progress "Starting a scroll movement while another one is still in progress"
[minimum-speed]: #minimum-speed "Minimum speed"
[user-interaction]: #aborting-when-the-user-scrolls-clicks-or-taps "Aborting when the user scrolls, clicks, or taps"
[animation-options]: #animation-options "Animation options"
[stopping]: #stopping-scroll-animations "Stopping scroll animations"
[custom-queues]: #custom-queues "Custom queues"
[scrollable-distance]: #retrieving-the-maximum-scrollable-distance-within-an-element "Retrieving the maximum scrollable distance within an element"
[scrollable-element]: #getting-the-scrollable-element "Getting the scrollable element"
[browsers]: #browser-support "Browser support"
[build]: #build-process-and-tests "Build process and tests"

[scrolling-both-axes]: #scrolling-to-a-fixed-position-on-both-axes "Scrolling to a fixed position on both axes"
[ignoring-the-user]: #ignoring-the-user "Ignoring the user"
[tweaking-scroll-detection]: #tweaking-the-user-scroll-detection "Tweaking the user scroll detection"
[tool-chain-commands]: #tool-chain-and-commands "Tool chain and commands"

[Node.js]: http://nodejs.org/ "Node.js"
[Bower]: http://bower.io/ "Bower: a package manager for the web"
[npm]: https://npmjs.org/ "npm: Node Packaged Modules"
[Grunt]: http://gruntjs.com/ "Grunt: The JavaScript Task Runner"
[Karma]: http://karma-runner.github.io/ "Karma – Spectacular Test Runner for Javascript"
[Jasmine]: http://jasmine.github.io/ "Jasmine: Behavior-Driven JavaScript"
[JSHint]: http://www.jshint.com/ "JSHint, a JavaScript Code Quality Tool"
