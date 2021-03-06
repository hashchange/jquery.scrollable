( function ( mgr, lib, core ) {
    "use strict";

    /**
     * In here, all arguments ($container, position, options) are expected to be normalized when they are passed to a
     * function.
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
     * @param {number|string|Object} position    must be normalized
     * @param {Object}               options     must be normalized
     */
    mgr.scrollTo = function ( $container, position, options ) {
        var stopOptions,
            notifyCancelled = extractNotifyCancelled( options ) || {};

        // Callbacks for window animations are bound to the window, not the animated element
        if ( $.isWindow( $container[0] ) ) options = lib.bindAnimationCallbacks( options, $container[0] );

        // Skip animation if the base position already matches the target position.
        if ( ! lib.isRedundantTarget( position, lib.getScrollStartPosition( $container, options ) ) ) {

            // If there are animations executing or being queued, capture the history of animation steps immediately
            // preceding the new animation.
            //
            // The new animation can use the history to detect user scrolling more accurately, or rather suppress false
            // detections, in iOS. See addUserScrollDetection() (lib module) for more.

            if ( options.append ) {
                options._history = lib.getLastStepHistory( $container, options );
            } else {
                // Not appending, so stop an ongoing scroll and empty the queue
                $.extend( notifyCancelled, { cancelled: options.merge ? "merge" : "replace" } );
                stopOptions = $.extend( { notifyCancelled: notifyCancelled }, options );
                options._history = mgr.stopScroll( $container, stopOptions );
            }

            core.animateScroll( $container, position, options );

        }
    };

    /**
     * @param   {jQuery}         $container                            must be normalized
     * @param   {Object}         options                               must be normalized
     * @param   {string|boolean} options.queue                         set during options normalization if not provided explicitly
     * @param   {boolean}        [options.jumpToTargetPosition=false]
     * @param   {Object}         [options.notifyCancelled]
     * @returns {StepHistory}    the step history of the stopped animation
     */
    mgr.stopScroll = function ( $container, options ) {
        var notifyCancelled = extractNotifyCancelled( options ),
            $scrollable = mgr.getScrollable( $container );

        return lib.stopScrollAnimation( $scrollable, options, notifyCancelled );
    };

    /**
     * @param {jQuery}   $container       must be normalized
     * @param {Object}   message
     * @param {string[]} [callbackNames]  defaults to all exit callbacks ("complete", "done", "fail", "always")
     * @param {string}   [queueName]      usually not required, set to the scroll queue by default
     */
    mgr.notifyScrollCallbacks = function ( $container, message, callbackNames, queueName ) {
        var $scrollable = mgr.getScrollable( $container );
        lib.notifyScrollCallbacks( $scrollable, message, callbackNames, queueName );
    };

    /**
     * Extracts the notifyCancelled option from the options object. Removes the notifyCancelled property from the input
     * object, modifying it. Returns an independent copy of the notifyCancelled object.
     *
     * Returns undefined if the notifyCancelled option does not exist.
     *
     * @param   {Object} [options]
     * @returns {Object|undefined}
     */
    function extractNotifyCancelled ( options ) {
        var notifyCancelled;

        if ( options && options.notifyCancelled ) {
            if ( !$.isPlainObject( options.notifyCancelled ) ) throw new Error( 'Invalid notifyCancelled option. Expected a hash but got type ' + $.type( options.notifyCancelled ) );

            notifyCancelled = $.extend( {}, options.notifyCancelled );
            delete options.notifyCancelled;
        }

        return notifyCancelled;
    }

} )( mgr, lib, core );