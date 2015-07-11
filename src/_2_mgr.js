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
        // Callbacks for window animations are bound to the window, not the animated element
        if ( $.isWindow( $container[0] ) ) options = lib.bindAnimationCallbacks( options, $container[0] );

        // Skip animation if the base position already matches the target position.
        if ( ! lib.isRedundantTarget( position, lib.getScrollStartPosition( $container, options ) ) ) {

            if ( ! options.append ) mgr.stopScroll( $container, options );

            core.animateScroll( $container, position, options );

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

} )( mgr, lib, core );