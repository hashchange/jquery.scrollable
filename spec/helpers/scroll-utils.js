/**
 * Sets the default duration for animations during the tests. The duration is reduced in order to speed up the tests.
 *
 * NB Reducing the duration too far makes the tests less reliable. Tests start failing randomly if the duration is too
 * short, relative to the distances scrolled (ie, relative to the size of the browser window).
 */
function reduceDefaultDurationForAnimations () {
    $.fx.speeds._default = 300;
}

/**
 * Restores the jQuery default duration for animations (400ms).
 */
function restoreDefaultDurationForAnimations () {
    $.fx.speeds._default = 400;
}

/**
 * Delays the execution of a (test) function long enough to let a programmatic scroll action take place.
 *
 * @param {Function} testFunc
 * @param {boolean}  [waitForRubberBand=false]  if true, an additional waiting period is added to allow rubber-band
 *                                              bouncing to finish (useful on mobile)
 * @param {number}   [duration]                 defaults to the jQuery default duration + a "padding" defined in
 *                                              _getPaddingMultiplier (but at least 10ms)
 */
function afterScroll ( testFunc, waitForRubberBand, duration ) {
    if ( !_.isUndefined( waitForRubberBand ) && !_.isBoolean( waitForRubberBand ) ) throw new Error( "waitForRubberBand must be a boolean, or left undefined" );
    if ( _.isUndefined( duration ) ) duration = Math.max( $.fx.speeds._default + 10, Math.ceil( $.fx.speeds._default * _getPaddingMultiplier() ) );
    if ( waitForRubberBand ) duration += _getRubberBandEffectDuration();

    _.delay( testFunc, duration );
}

/**
 * Delays the execution of a (test) function long enough to let a number of programmatic scroll action take place. The
 * duration of these scrolls must have been left at the default.
 *
 * Also adds a "padding" to the total scroll time. The padding percentage is defined in _getPaddingMultiplier; it is at
 * least 10ms.
 *
 * @param {number}   factor    number of scroll animations to wait for. Fractions are ok, too.
 * @param {Function} testFunc
 * @param {boolean}  [waitForRubberBand=false]  if true, an additional waiting period is added to allow rubber-band
 *                                              bouncing to finish (useful on mobile). Only added for the last scroll.
 */
function afterScrolls ( factor, testFunc, waitForRubberBand ) {
    var duration = Math.max( $.fx.speeds._default * factor + 10, Math.ceil( $.fx.speeds._default * factor * _getPaddingMultiplier() ) );
    afterScroll( testFunc, waitForRubberBand, duration );
}

/**
 * Delays the execution of a function long enough to let a programmatic scroll action go half way.
 *
 * @param {Function} func
 * @param {number}   [duration]  defaults to half of the jQuery default duration, which usually equates to 200ms
 */
function inMidScroll ( func, duration ) {
    _.delay( func, _.isUndefined( duration ) ? Math.ceil( $.fx.speeds._default / 2 ) : duration );
}

/**
 * Delays the execution of a function long enough to let a programmatic scroll action begin. After 10% of the scroll
 * duration have passed, the callback executes.
 *
 * @param {Function} func
 * @param {number}   [duration]  defaults to 10% of the jQuery default duration, which usually equates to 40ms
 */
function earlyInMidScroll ( func, duration ) {
    _.delay( func, _.isUndefined( duration ) ? Math.ceil( $.fx.speeds._default / 10 ) : duration );
}

/**
 * Returns true if a test should wait for a rubber band effect to subside, and the rubber band animation to come to an
 * end.
 *
 * Always true on mobile, otherwise false. This is a synonym of isMobile(), but more expressive in the given context.
 *
 * Typically used in afterScroll calls, as in `afterScroll( function () {}, waitForRubberBand() )`.
 */
function waitForRubberBand () {
    return isMobile();
}

/**
 * Sets a timeout in order to unblock the UI and give the browser - even a slow one - ample time to repaint, then
 * executes the callback.
 *
 * @param {Function} callback
 */
function afterScreenUpdate( callback ) {
    setTimeout( callback, 250 );
}

/**
 * Returns the multiplier used for padding the scroll timeouts (for afterScroll etc).
 *
 * @returns {number}
 */
function _getPaddingMultiplier () {
    var paddingPercent = 15;
    return ( 100 + paddingPercent ) / 100;
}

/**
 * Returns the additional delay allowing a rubber band effects to subside.
 *
 * @returns {number}
 */
function _getRubberBandEffectDuration () {
    return 400;
}

/**
 * Returns a function which captures information about scroll callback calls.
 *
 * Expects the name of the animation callback, a hash for collecting data, and the scroll container as arguments.
 *
 * The returned function logs
 *
 * - the context (value of `this`)
 * - the number of calls
 * - the arguments
 * - the scroll state at the time of invocation. (Only the last invocation is logged.)
 *
 * @param   {string} callbackName
 * @param   {Object} callsCollector
 * @param   {jQuery} $scrollContainer
 * @returns {Function}
 */
function getCallbackLogger( callbackName, callsCollector, $scrollContainer ) {
    return function () {
        var collector;

        if ( ! callsCollector[callbackName] ) callsCollector[callbackName] = { callCount: 0 };

        collector = callsCollector[callbackName];

        collector.context = this;
        collector.callCount++;
        collector.args = $.makeArray( arguments );
        // Scroll state is logged for last invocation of the callback.
        collector.scrollState = { x: $scrollContainer.scrollLeft(), y: $scrollContainer.scrollTop() };
    }
}

/**
 * Creates a set of observed animation callbacks. The callbacks report call data in a hash, and are monitored with
 * Jasmine spies in addition.
 *
 * Expects a hash for collecting data, and the scroll container as arguments.
 *
 * See getCallbackLogger for more on the observed data.
 *
 * @param   {Object} callsCollector
 * @param   {jQuery} $scrollContainer
 * @returns {{start: Function, step: Function, progress: Function, done: Function, complete: Function, fail: Function, always: Function}}
 */
function createObservedCallbacks ( callsCollector, $scrollContainer ) {
    var callbacks = {
        start: getCallbackLogger( "start", callsCollector, $scrollContainer ),
        step: getCallbackLogger( "step", callsCollector, $scrollContainer ),
        progress: getCallbackLogger( "progress", callsCollector, $scrollContainer ),
        done: getCallbackLogger( "done", callsCollector, $scrollContainer ),
        complete: getCallbackLogger( "complete", callsCollector, $scrollContainer ),
        fail: getCallbackLogger( "fail", callsCollector, $scrollContainer ),
        always: getCallbackLogger( "always", callsCollector, $scrollContainer )
    };

    spyOn( callbacks, 'start' ).and.callThrough();
    spyOn( callbacks, 'step' ).and.callThrough();
    spyOn( callbacks, 'progress' ).and.callThrough();
    spyOn( callbacks, 'done' ).and.callThrough();
    spyOn( callbacks, 'complete' ).and.callThrough();
    spyOn( callbacks, 'fail' ).and.callThrough();
    spyOn( callbacks, 'always' ).and.callThrough();

    return callbacks;
}

/**
 * Scrolls to a new position immediately, without animation, based on the current scroll position. Returns the new
 * position as a hash of (px) numbers: { x: ..., y: ... }.
 *
 * The amount to be scrolled can either be a number, which will scroll the vertical axis, or a hash containing one or
 * both axes, e.g. { x: 20 } or { x: 20, y: 20 }.
 *
 * Does not apply any silent corrections if the target position is less than 0 or beyond the maximum scrollable distance.
 * On the contrary, it throws an exception if the desired distance can't be scrolled.
 *
 * @param   {Object|number} amount
 * @param   {jQuery}        $container  should be $( window ) if the window is scrolled
 * @returns {{x: number, y: number}}
 */
function userScrollsBy ( amount, $container ) {
    var target, result;

    if ( _.isNumber( amount ) ) amount = { x: 0, y: amount };

    target = {
        x: $container.scrollLeft() + ( amount.x || 0 ),
        y: $container.scrollTop() + ( amount.y || 0 )
    };

    $container
        .scrollLeft( target.x )
        .scrollTop( target.y );

    result = {
        x: $container.scrollLeft(),
        y: $container.scrollTop()
    };

    if ( Math.round( target.x ) !== Math.round( result.x ) || Math.round( target.y ) !== Math.round ( result.y ) ) throw new Error( "userScrollsBy: target is beyond the scrollable distance (horizontally by " + ( target.x - result.x ) + "px, vertically by " + ( target.y - result.y ) + "px)" );

    return result;
}

/**
 * Simulates a user click in the given container. Returns the scroll position at which the click occurred.
 *
 * @param   {jQuery} $container  should be $( window ) if the window is scrolled
 * @returns {{x: number, y: number}}
 */
function userClicks ( $container ) {
    var $clickable = $.isWindow( $container[0] ) ? $( $container[0].document.body ) : $container;

    $clickable
        .mousedown()
        .mouseup()
        .click();
    
    return {
        x: $container.scrollLeft(),
        y: $container.scrollTop()
    };
}

/**
 * Simulates a user tap in the given container. Returns the scroll position at which the tap occurred.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 * ATTN The tap gesture is async!
 *
 * The tap gesture takes 100ms by default. The position returned by the function is captured when the tap begins, not
 * when it is complete.
 *
 * You can change it with the option capturePositionAsync. In that case, the positions object is set to { x: "invalid",
 * y: "invalid" } initially, and is updated with the current scroll position when the tap ends.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 *
 * Requires hammerjs/simulator to be installed.
 *
 * @param   {jQuery}  $container                            should be $( window ) if the window is scrolled
 * @param   {Object}  [options]
 * @param   {boolean} [options.capturePositionAsync=false]
 *
 * @returns {{x: number, y: number}}
 */
function userTaps ( $container, options ) {
    var el = $.isWindow( $container[0] ) ? $container[0].document.body : $container[0],
        startPosition = {
            x: $container.scrollLeft(),
            y: $container.scrollTop()
        },
        endPosition = {
            x: "invalid",
            y: "invalid"
        };

    if ( typeof Simulator === "undefined" ) {
        throw new Error( "Test environment: Tap simulator is missing. Please install hammerjs/simulator." );
    } else {
        Simulator.gestures.tap( el, undefined, function () {
            endPosition.x = $container.scrollLeft();
            endPosition.y = $container.scrollTop();
        } );
    }

    return ( options && options.capturePositionAsync ) ? endPosition : startPosition;
}

/**
 * Returns the current scroll location as a hash of (px) numbers: { x: ..., y: ... }.
 *
 * @param   {jQuery} $container  should be $( window ) if the window is scrolled
 * @returns {{x: number, y: number}}
 */
function getCurrentScrollLocation ( $container ) {
    return {
        x: $container.scrollLeft(),
        y: $container.scrollTop()
    };
}


