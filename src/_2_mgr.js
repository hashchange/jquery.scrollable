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
        var stopOptions;

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
                stopOptions = $.extend( { cancelled: options.merge ? "merge" : "replace" }, options );
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
     * @returns {StepHistory}    the step history of the stopped animation
     */
    mgr.stopScroll = function ( $container, options ) {
        var $scrollable = mgr.getScrollable( $container );
        return lib.stopScrollAnimation( $scrollable, options );
    };

} )( mgr, lib, core );