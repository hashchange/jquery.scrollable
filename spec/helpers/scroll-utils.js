/**
 * Delays the execution of a (test) function long enough to let a programmatic scroll action take place.
 *
 * @param {Function} testFunc
 * @param {number}   [duration]  defaults to the jQuery default duration + 10% "padding", which usually equates to 404ms
 */
function afterScroll ( testFunc, duration ) {
    _.delay( testFunc, _.isUndefined( duration ) ? Math.ceil( $.fx.speeds._default * 1.1 )  : duration );
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


