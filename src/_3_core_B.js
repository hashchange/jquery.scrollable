/**
 * Core, option B:
 *
 * The scrollable element for a window is not detected. Instead, both possible candidates (document Element, body) are
 * animated.
 */

( function ( core, lib ) {
    "use strict";

    /**
     * Returns the scrollable element, in a jQuery wrapper. The container element is expected to be normalized.
     *
     * The return value of the method is determined as follows:
     *
     * - For ordinary elements, it returns the element itself.
     *
     * - For the window, it returns a set consisting of body and documentElement. Document, documentElement and body are
     *   considered to mean "window", and are treated the same.
     *
     * - For an iframe element, it returns body and documentElement of the iframe content window.
     *
     * If an empty jQuery set is passed in, an empty jQuery set is returned.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
    core.getScrollable = function ( $container ) {
        return $.isWindow( $container[0] ) ? getWindowScrollable( $container[0] ) : $container;
    };

    /**
     * Animates the scroll movement. The container element is expected to be normalized.
     *
     * @param {jQuery} $container
     * @param {number} position
     * @param {Object} [options]
     */
    core.animateScroll = function ( $container, position, options ) {

        var $scrollable = core.getScrollable( $container );

        options || ( options = {} );
        if ( !options.queue && options.queue !== false ) options.queue = core.queueName;

        if ( $.isWindow( $container[0] ) ) {
            animateWindowScroll( $scrollable, position, options );
        } else {
            lib.addScrollAnimation( $scrollable, position, options );
        }

    };


    function animateWindowScroll ( $scrollable, position, options ) {

        var callbacks = lib.extractCallbacks( options ),
            calledInBodyContext = function () {
                var elem = this;
                return elem && elem.nodeName && elem.nodeName.toLowerCase() === "body";
            };

        // Here, we are mostly concerned with preventing callbacks from firing twice.
        //
        // We simply filter out the calls for one animated element and let them pass for the other. Which element? That
        // is an arbitrary choice. We cannot know the true scrollable element, so we just pick one. We go with "body"
        // here.
        //
        // Luckily for us, the choice of element doesn't matter. The callbacks are fired an identical number of times
        // for both elements, and they are passed the exact same data for each call, even though one of the elements
        // isn't animated at all.
        $.each( callbacks, function ( name, callback ) {
            options[name] = runIf( callback, calledInBodyContext );
        } );

        // Run the animation.
        lib.addScrollAnimation( $scrollable, position, options );

    }

    function getWindowScrollable ( currentWindow ) {
        return $( [ currentWindow.document.documentElement, currentWindow.document.body ] );
    }

    /**
     * Takes a function and returns a function which skips every other call. Even calls (2nd, 4th) are executed, while
     * the odd ones (1st call, 3rd etc) are dropped.
     *
     * The original function, when actually called, is passed all the arguments. It is executed in the global context
     * (window) unless it has been bound to a specific context prior to being passed in.
     *
     * @param {Function} fn
     */
    function skipOddCalls( fn ) {

        return (function ( count ) {

            count = 0;
            return function () {
                count++;
                if ( count % 2 === 0 ) fn.apply( undefined, arguments );
            };

        } )();

    }

    /**
     * Creates a wrapper function which executes a function if a test returns true.
     *
     * Both the target function and the test function are passed the arguments the wrapper is called with. They are also
     * invoked with the same context the wrapper is set to (window by default).
     *
     * If either the target function or the test function need a specific context which is different from the one in
     * runIf, they must be bound to that context before being passed in.
     *
     * @param   {Function} fn
     * @param   {Function} test
     * @returns {Function}
     */
    function runIf ( fn, test ) {

        return function () {
            if ( test.apply( this, arguments ) ) fn.apply( this, arguments );
        };

    }

} )( core, lib );



