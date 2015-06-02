( function ( mgr, lib, core, queue ) {
    "use strict";

    /**
     * In here, $container and $options are expected to be normalized when they are passed to a function.
     */

    /**
     * @param   {jQuery} $container  must be normalized
     * @returns {jQuery}
     */
    mgr.getScrollable = function ( $container ) {
        return core.getScrollable( $container );
    };

    /**
     * @param   {jQuery} $container  must be normalized
     * @param   {string} axis        must be normalized
     * @returns {number|Object}
     */
    mgr.getScrollRange = function ( $container, axis ) {
        return lib.getScrollMaximum( $container, axis );
    };

    /**
     * @param {jQuery}               $container  must be normalized
     * @param {number|string|Object} position    must NOT be normalized yet (has to happen later, timing is important)
     * @param {Object}               options     must be normalized
     */
    mgr.scrollTo = function ( $container, position, options ) {
        var queueLength;

        if ( options.append )  {
            // The new animation call must be delayed if movements happen in sequence (`append` flag) and other
            // animations are still lined up or executing ahead of the new one.
            //
            // `$.fn.animate()` asks for the final position of the scroll, in absolute terms. Yet the position argument
            // allows users to define the position in relative terms ("+=100px"). Because the `append` flag is set,
            // animations are supposed to be chained. A relative position is based on the final destination of the
            // preceding animation.
            //
            // Hence, we have to wait for the preceding animation to finish before we can resolve the position and set
            // up the animation itself. We put a proxy into the queue instead.
            queueLength = mgr.getScrollable( $container ).queue( options.queue ).length;

            if ( queueLength ) {
                proxyScrollTo( $container, position, options );
            } else {
                // Empty queue, no need to delay
                executeScrollTo( $container, position, options );
            }
        } else {
            executeScrollTo( $container, position, options );
        }
    };

    /**
     * @param {jQuery}         $container                            must be normalized
     * @param {Object}         options                               must be normalized
     * @param {string|boolean} options.queue                         set during options normalization if not provided explicitly
     * @param {boolean}        [options.jumpToTargetPosition=false]
     */
    mgr.stopScroll = function ( $container, options ) {
        var $scrollable = mgr.getScrollable( $container );
        lib.stopScrollAnimation( $scrollable, options );
    };

    /**
     * Puts a proxy for a scroll animation into the queue. It acts as a placeholder for the animation. The proxy wraps
     * the actual animation call, allowing us to delay the call until the proxy executes.
     *
     * When the proxy is dequeued, it places the animation at the front of the queue so that it executes next.
     *
     * @param {jQuery}               $container  must be normalized
     * @param {number|string|Object} position    must NOT be normalized yet (has to happen later, timing is important)
     * @param {Object}               options     must be normalized
     */
    function proxyScrollTo ( $container, position, options ) {
        var $scrollable = mgr.getScrollable( $container );

        // Flag the presence of a proxy in the queue. Later on, lib.addAnimation responds to it.
        options._proxyIsQueued = true;

        // Create the proxy. Note that the queued "payload" function is not $.fn.animate, but executeScrollTo - ie, a
        // function which in turn will put $.fn.animate into the queue.
        queue.addToQueue( {
            $elem: $scrollable,
            func: executeScrollTo,
            args: [ $container, position, options ],
            isAnimation: false,
            queue: options.queue
        } );
    }

    /**
     * Resolves (normalizes) the position argument and puts a scroll animation into the queue.
     *
     * @param {jQuery}               $container  must be normalized
     * @param {number|string|Object} position    must NOT be normalized yet (is done here)
     * @param {Object}               options     must be normalized
     */
    function executeScrollTo ( $container, position, options ) {
        position = lib.normalizePosition( position, $container, options );

        // Callbacks for window animations are bound to the window, not the animated element
        if ( $.isWindow( $container[0] ) ) options = lib.bindAnimationCallbacks( options, $container[0] );

        if ( ! options.append ) mgr.stopScroll( $container, options );
        core.animateScroll( $container, position, options );
    }

} )( mgr, lib, core, queue );