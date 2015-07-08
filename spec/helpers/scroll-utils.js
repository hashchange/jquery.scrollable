/**
 * Delays the execution of a (test) function long enough to let a programmatic scroll action take place.
 *
 * @param {Function} testFunc
 * @param {number}   [duration]  defaults to the jQuery default duration + a "padding" of 10% (at least 10ms), which
 *                               usually equates to 410ms
 */
function afterScroll ( testFunc, duration ) {
    if ( _.isUndefined( duration ) ) duration = Math.max( $.fx.speeds._default + 10, Math.ceil( $.fx.speeds._default * 1.1 ) );
    _.delay( testFunc, duration );
}

/**
 * Delays the execution of a (test) function long enough to let a number of programmatic scroll action take place. The
 * duration of these scrolls must have been left at the default.
 *
 * Also adds a "padding" of 10% (at least 10ms) to the total scroll time.
 *
 * @param {Function} testFunc
 * @param {number}   factor    number of scroll animations to wait for. Fractions are ok, too.
 */
function afterScrolls ( factor, testFunc ) {
    var duration = Math.max( $.fx.speeds._default * factor + 10, Math.ceil( $.fx.speeds._default * factor * 1.1 ) );
    afterScroll( testFunc, duration );
}

/**
 * Delays the execution of a function long enough to let a programmatic scroll action go half way.
 *
 * @param {Function} func
 * @param {number}   [duration]  defaults to half of the jQuery default duration, which usually equates to 200ms
 */
function inMidScroll ( func, duration ) {
    _.delay( func, _.isUndefined( duration ) ? Math.ceil( $.fx.speeds._default / 2 )  : duration );
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

        collector.this = this;
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


