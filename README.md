# jQuery.scrollable

<small>[Setup][setup] – [Why?][why] – [Usage][usage] – [Browser support][browsers] – [Build and test][build]</small>

jQuery.scrollable manages animated scrolling in windows, scrollable elements and iframes. It frees you from handling gotchas and edge cases and offers convenient, flexible options for animation.

If you are a happy user of this project already, you can support its development by [donating to it][donations]. You absolutely don't have to, of course, but perhaps it is something you [might actually want to do][donations].

## Dependencies and setup

jQuery.scrollable depends on [jQuery][] and [jQuery.documentSize][]. They must be ready for use when jquery.scrollable.js is loaded.

The stable version of jQuery.scrollable is available in the `dist` directory ([dev][dist-dev], [prod][dist-prod]), including an AMD build ([dev][dist-amd-dev], [prod][dist-amd-prod]). If you use Bower, fetch the files with `bower install jquery.scrollable`. With npm, it is `npm install jquery.scrollable`.

## Why?

On the face of it, animated scrolling is such a trivial task with jQuery that you'd be forgiven to think a plugin is foolish. Doesn't a one liner get you there? Is a call along the lines of `$elem.animate( { scrollTop: 1200 } )` not enough?

Yes. And no. In a number of respects, the jQuery solution isn't quite good enough – or, depending on your priorities, nowhere near good enough. And your users might share that view.

###### User experience

- A jQuery animation doesn't respond to user actions. Once the animation has begun, it carries on, no matter how often the user clicks, taps, or tries to scroll. By contrast, jQuery.scrollable [respects user actions][user-interaction], and allows you to customize your response.

- jQuery doesn't deal well with overlapping calls. What happens when there is a button triggering a scroll, and a user clicks it seven times in a row? Or when a scroll movement is supposed to begin, but a previous one hasn't finished yet? jQuery.scrollable lets you [choose the outcome][overlapping-calls], in a way that always works.

- jQuery animations turn into a crawl when covering short distances. jQuery.scrollable prevents that by introducing a [minimum speed][minimum-speed].

###### Navigating the gotchas

- The right way to animate window scrolling depends on the browser. Common solutions cause callbacks to [behave weirdly][so-callbacks-called-twice], leading to workarounds which introduce [other inconsistencies][so-comment-callback-filtering]. 

  jQuery.scrollable establishes the correct approach, behind the scenes, by actually testing the browser behaviour. Callbacks work as they should, or perhaps even [a bit better][animation-callbacks].

- Let a component do the math. For instance, if your scroll target happens to be near the bottom of the page, it can't be scrolled to the top of the window. Account for that, or else the scroll animation hits the end of its run at full speed, and stops jarringly. 

  That kind of thing. One would assume that it's taken care of in a component like jQuery.scrollable, and it is.

- Keep things separate. jQuery.scrollable manages scrolling in its own [dedicated animation queue][stopping] so as not to interfere with other animations on the page.

###### Ease of use

- Well, you get [relative scrolling][relative-scrolling], [simultaneous or sequential][scrolling-both-axes] scrolling on both axes, a [very][window-scrolling] [permissive][absolute-scrolling] syntax, keywords, percentages, and stuff.

## OK. How?

It's super simple. And it gives you a lot of flexibility.

Target positions: [Window scrolling][window-scrolling] – [Absolute target][absolute-scrolling] – [Relative target][relative-scrolling]<br>
User experience: [Overlapping calls][overlapping-calls] – [Minimum speed][minimum-speed] – [User interaction][user-interaction]<br>
Animation: [Callbacks][animation-callbacks] – [Options][animation-options] – [Stopping][stopping] – [Custom queues][custom-queues]<br>
Helpers: [Scrollable distance][scrollable-distance] – [Scrollable element][scrollable-element]

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

When chaining scroll movements, the `append` option does the trick. Normally, when you call `scrollTo()`, a previous, ongoing scroll animation is [stopped in its tracks][overlapping-calls] and replaced by the new one. With `append: true`, you can prevent that and queue your scroll movements. 

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

If an animation is cancelled while it is in progress, its `fail` and `always` callbacks run. The callbacks receive a `cancelled: "replace"` or `cancelled: "merge"` [message][animation-callbacks-message-arg], depending on the mode of the replacement. However, if an animation is cancelled while it is still waiting in the queue, it simply disappears, and none of its callbacks are called.

In **append** mode, preceding animations always run their course, and their callbacks are called as usual.

##### What happens if the new call is redundant because it aims for the same position?

If `scrollTo` targets the exact same position it starts from, the call is ignored. There is no animation, and animation callbacks don't run, either. This policy manifests itself in a number of ways, with subtle differences.

- The first case is obvious. Suppose the browser is **at rest**, without another scroll animation in progress. If a `scrollTo` call is targeting a position which has already been reached, the call is ignored. The scroll mode (replace, append, merge) does not matter in this case.

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

A larger threshold means a larger zone of constant speed, and larger variations in scroll duration. You can even enforce a **constant speed throughout**. To achieve that, make the threshold at least as large as the [maximum distance][scrollable-distance] that can be scrolled. Then tweak the speed indirectly: by changing the nominal `duration` (speed = threshold / duration). 

### Aborting when the user scrolls, clicks, or taps

An animation initiated by `scrollTo` is automatically stopped as soon as

- the user scrolls
- the user holds down a mouse button, clicks, or double-clicks in the scrolling area
- the user touches the screen in the scrolling area, in a touch-enabled device.

That way, the actions of the user are respected. They take precedence over automated animations.

The `fail` and `always` callbacks of a stopped animation are notified of the cause with a [`cancelled: "click"`][animation-callbacks-message-arg] or [`cancelled: "scroll"`][animation-callbacks-message-arg] message. The `"click"` value of the message also covers touch.

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

It should be said, though, that overriding the user's intent in this way is a Bad Idea (tm) in almost every case. Use `ignoreUser` judiciously.

##### Tweaking the user scroll detection

A scroll animation is aborted when the user has tried to scroll by more than 10px, in any direction. Below that threshold, user scrolling is considered to be accidental and insufficient to signal intent.

You can tweak that threshold, even though there hardly ever is any need to do so. The default setting is stored in a global, which you can modify: `$.scrollable.userScrollThreshold = 50`. You can also set the threshold for an individual animation with the `userScrollThreshold` option: `$elem.scrollTo( 1000, { userScrollThreshold: 50 }`. 

The minimum value for the threshold is 5.

### Animation callbacks

The animation callbacks are the same as the standard [`jQuery.animate()` callbacks][jQuery-animate-options]. But beyond being fully compatible with the `animate()` format, the callbacks have been enhanced a bit.

##### Context

In jQuery fashion, animation callbacks such as `start`, `complete`, etc are bound to the animated element. 

But there is an exception: window scroll animations are bound to the appropriate `window`. Ie, inside the callbacks, the `this` keyword represents the window object, not the real scrollable element (`documentElement` or `body`).

##### Arguments

All callbacks are called with the [same arguments as in `animate()`][jQuery-animate-options]. Beyond that, some callbacks receive an additional `message` argument. It is passed to `complete`, `done`, `fail`, `always` – ie, the callbacks which run when the animation exits. 

- `complete` signature: `function( message )`
- `done`, `fail`, `always` signature: `function( animation, jumpedToEnd, message )`

The `animation` and `jumpedToEnd` arguments are the ones you know from `animate()`. The `message` argument is exclusive to `scrollTo` calls.

###### The message argument

The `message` argument is a hash – an empty one by default. It can be used to send information to callbacks of animations which have already been kicked off. These animations are either already running, or waiting their turn in the queue. The `message` argument is where that information arrives.

In some cases, the message argument is populated automatically. That happens when an animation is stopped, or removed from the queue, by a built-in mechanism of jQuery.scrollable. Then, the cause of the cancellation is exposed in the message hash, in the property `cancelled`.

- `cancelled: "replace"`:<br>
  The animation is replaced by a new scroll which has started in [`replace`][overlapping-calls] mode.
- `cancelled: "merge"`<br>
  The animation is replaced by a new scroll which has started in [`merge`][overlapping-calls] mode.
- `cancelled: "click"`:<br>
  The animation is stopped because the user has [clicked or tapped][user-interaction].
- `cancelled: "scroll"`:<br>
  The animation is stopped because the user [has scrolled][user-interaction].
 
A callback which uses the `cancelled` flag would look somewhat like this:

```js
$elem.scrollTo( "bottom", { 
    fail: function ( animation, jumpedToEnd, message ) {
        if ( message.cancelled === "merge" ) {
            // do stuff
        }
    }
} );
```

Because these messages appear when a scroll animation ends prematurely, they only show up in `fail` and `always` callbacks. The `complete` and `done` callbacks don't fire then. 

###### Sending messages

You can send your own messages to the callbacks of ongoing and queued animations. Such a message must be a hash (e.g. `{ status: "foo", someFlag: true }`). If there are multiple messages to the same callbacks, their content is merged.

You can pass messages to callbacks in a number of ways.

- With **`stopScroll`**:

  ```js
  $elem.stopScroll( { notifyCancelled: message } );
  ```

  Use the `notifyCancelled` option to send a message. It is passed to the `fail` and `always` callbacks of the scroll animation which is stopped.

- With **`scrollTo`**:

  ```js
  $elem.scrollTo( position, { notifyCancelled: message } );
  ```

  Again, use the `notifyCancelled` option to attach a message. The message is passed to the `fail` and `always` callbacks of a preceding, ongoing scroll animation. But it is passed only if that animation is being stopped and replaced by the current `scrollTo` call. 

  The callbacks of that preceding animation [also receive][animation-callbacks-message-arg] a `cancelled: "replace"` or `cancelled: "merge"` message, and your custom message is merged with it.

  There are cases when an ongoing scroll animation is _not_ being stopped and replaced. The `notifyCancelled` option does not apply then. If you call `scrollTo()` with the `append` option, [existing animations continue][overlapping-calls], and the `notifyCancelled` option is ignored.

  Likewise, if `scrollTo()` is called with the [`merge`][overlapping-calls] option, and it is aiming for the same position as the preceding scroll animations, the current call [is ignored][overlapping-calls-same-position]. Those other scroll animations continue. Because they aren't cancelled, the `notifyCancelled` option in the current call does not have any effect, either.

  As already said, the message is passed to the callbacks of _preceding_ scroll animations. It is not passed to the callbacks of the current `scrollTo` call, nor to future ones.

- With **`notifyScrollCallbacks`**:

  ```js
  $elem.notifyScrollCallbacks( message, [callbackNames], [queueName] );
  ```

  The `notifyScrollCallbacks` method exists specifically for dispatching messages. It sends a message to the callbacks of scroll animations which are currently executing or waiting for their turn in the queue.

  You can restrict the delivery of a message to a specific callback type (e.g. `"done"`), or to a number of types (e.g. `["complete", "done"]`). Pass the name of the callback, or an array of names, as the **`callbackNames`** argument. If omitted, the message is sent to the callback types `complete`, `done`, `fail`, and `always`. 

  Messages can only be sent to exit callbacks (`complete`, `done`, `fail`, `always`). The `start`, `step`, and `progress` callbacks don't get called with a message argument. If you name them in the `callbackNames` argument, an error is thrown.

  A `notifyScrollCallbacks` call only acts on animations which are running or in the queue at the time the call is made. It does not affect callbacks of animations which are initiated or queued later on.

  You'll rarely need to use the last argument, **`queueName`**. You must pass a queue name if you use your [own custom queue][custom-queues], otherwise omit it. The name defaults to the [dedicated, internal queue][stopping] that the scroll animations run in. And usually, is is a good idea to [leave it that way][custom-queues].

### Animation options

We have already covered

- the options [`axis`][absolute-scrolling], [`append`][overlapping-calls], and [`merge`][overlapping-calls]
- the [animation callbacks][animation-callbacks], and how to [send messages][animation-sending-messages] to them with `notifyCancelled`
- how to [set a minimum speed][minimum-speed] with `lockSpeedBelow`
- how to fine-tune the response to user interaction with [`ignoreUser`][ignoring-the-user] and the [`userScrollThreshold`][tweaking-scroll-detection] option.

In addition to these, you can use [every option available to `jQuery.animate()`][jQuery-animate-options]. Specify a `duration`, an `easing` etc. Add what you need to the options object which you pass to `scrollTo()`:

```js
$elem.scrollTo( 1200, { axis: "x", duration: 800 );
```

### Stopping scroll animations

Scroll animations run in their own, dedicated queue, so they don't interfere with other animations which may be going on at the same time. As a result, you can't and shouldn't stop scroll movements with the [generic jQuery `$elem.stop()` command][jquery-stop]. 

Use `$elem.stopScroll()` instead:

```js
$elem.stopScroll();
$elem.stopScroll( { jumpToTargetPosition: true } );
```

With the option `jumpToTargetPosition`, the window or container element jumps to the target position as the animation is aborted. By default, the scroll animation just stops wherever it happens to be.

Use the `notifyCancelled` option to [send a message][animation-sending-messages] to the `fail` and `always` callbacks of the scroll animation which is stopped.

In addition to stopping the ongoing animation, `stopScroll()` removes queued scroll animations, should there be any. But non-scroll animations and their queues are not affected – they proceed as normal.

**Important: You don't need to use `stopScroll()` when calling `scrollTo()` repeatedly**. 

When you call `scrollTo()` multiple times on the same container (e.g. the window), ongoing scroll movements are [stopped automatically][overlapping-calls] for you. In fact, you have to act if you _don't_ want to stop the current scroll movement. Use the [`append` option][scrolling-both-axes] then.

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

- 2015, 2016, 2017 versions of Chrome, Firefox, Safari, and Opera on the desktop
- IE8+, Edge
- Safari on iOS 8-10, Chrome on Android 5
- SlimerJS

IE8 can't handle the heavily asynchronous character of the unit tests. It has been tested manually instead, using the [AMD demo][tool-chain-commands] (run it with `grunt demo`).

## Build process and tests

If you'd like to fix, customize or otherwise improve the project: here are your tools.

### Setup

[npm][] sets up the environment for you.

- The only thing you've got to have on your machine (besides Git) is [Node.js]. Download the installer [here][Node.js].
- Clone the project and open a command prompt in the project directory.
- Run the setup with `npm run setup`.
- Make sure the Grunt CLI is installed as a global Node module. If not, or if you are not sure, run `npm install -g grunt-cli` from the command prompt.

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

Finally, if need be, you can set up a quick demo page to play with the code. First, edit the files in the `demo` directory. Then display `demo/index.html`, live-reloading your changes to the code or the page, with `grunt demo`. Libraries needed for the demo/playground should go into the Bower dev dependencies – in the project-wide `bower.json` – or else be managed by the dedicated `bower.json` in the demo directory.

_The `grunt interactive` and `grunt demo` commands spin up a web server, opening up the **whole project** to access via http._ So please be aware of the security implications. You can restrict that access to localhost in `Gruntfile.js` if you just use browsers on your machine.

### Changing the tool chain configuration

In case anything about the test and build process needs to be changed, have a look at the following config files:

- `karma.conf.js` (changes to dependencies, additional test frameworks)
- `Gruntfile.js`  (changes to the whole process)
- `web-mocha/_index.html` (changes to dependencies, additional test frameworks)

New test files in the `spec` directory are picked up automatically, no need to edit the configuration for that.

## Facilitating development

To my own surprise, [a kind soul][donations-idea] wanted to donate to one of my projects, but there hadn't been a link. [Now there is.][donations-paypal-link]

Please don't feel obliged in the slightest. The license here is [MIT][license], and so it's free. That said, if you do want to support the maintenance and development of this component, or any of my [other open-source projects][hashchange-projects-overview], I _am_ thankful for your contribution.

Naturally, these things don't pay for themselves – not even remotely. The components I write aim to be well tested, performant, and reliable. These qualities may not seem particularly fascinating, but I put a lot of emphasis on them because they make all the difference in production. They are also rather costly to maintain, time-wise.

That's why donations are welcome, and be it as nod of appreciation to keep spirits up. [Thank you!][donations-paypal-link]

[![Donate with Paypal][donations-paypal-button]][donations-paypal-link]

## Release Notes

### v1.2.3

- Updated jQuery dependency constraint for jQuery 3.2

### v1.2.2

- Updated jQuery dependency constraint for jQuery 3.1

### v1.2.1

- Updated dependencies, including jQuery to jQuery 3

### v1.2.0

- Introduced messages to callbacks
- Added `cancelled` messages with values `"replace"`, `"merge"`, `"click"`, `"scroll"`
- Added `notifyCancelled` option to `scrollTo()`, `stopScroll()`
- Added `$.fn.notifyScrollCallbacks()`

### v1.1.2

- Added support for the document.scrollingElement API

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

Copyright (c) 2015-2017 Michael Heim.

[dist-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.js "jquery.scrollable.js"
[dist-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/jquery.scrollable.min.js "jquery.scrollable.min.js"
[dist-amd-dev]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.js "jquery.scrollable.js, AMD build"
[dist-amd-prod]: https://raw.github.com/hashchange/jquery.scrollable/master/dist/amd/jquery.scrollable.min.js "jquery.scrollable.min.js, AMD build"

[jQuery]: http://jquery.com/ "jQuery"
[jQuery.documentSize]: https://github.com/hashchange/jquery.documentsize "jQuery.documentSize"

[so-comment-iframe-setup]: http://stackoverflow.com/questions/8149155/animate-scrolltop-not-working-in-firefox/21583714#comment46979441_21583714 "Stack Overflow: Animate scrollTop not working in firefox – Comment by @hashchange"
[so-callbacks-called-twice]: http://stackoverflow.com/q/8790752/508355 "Callback of .animate() gets called twice jquery – Stack Overflow"
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
[overlapping-calls-same-position]: #what-happens-if-the-new-call-is-redundant-because-it-aims-for-the-same-position "What happens if the new call is redundant because it aims for the same position?"
[minimum-speed]: #minimum-speed "Minimum speed"
[user-interaction]: #aborting-when-the-user-scrolls-clicks-or-taps "Aborting when the user scrolls, clicks, or taps"
[animation-callbacks]: #animation-callbacks "Animation callbacks"
[animation-callbacks-message-arg]: #the-message-argument "Animation callbacks: The message argument"
[animation-sending-messages]: #sending-messages "Animation callbacks: Sending messages"
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

[donations]: #facilitating-development "Facilitating development"
[donations-idea]: https://github.com/hashchange/jquery.documentsize/issues/1 "jQuery.documentSize, issue #1: Thank you!"
[donations-paypal-link]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RXZYTYWYSVJ2N "Donate with Paypal"
[donations-paypal-button]: https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif "Donate with Paypal"
[license]: #license "License"
[hashchange-projects-overview]: http://hashchange.github.io/ "Hacking the front end: Backbone, Marionette, jQuery and the DOM. An overview of open-source projects by @hashchange."
