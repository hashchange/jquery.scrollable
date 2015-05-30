var core = {},
    lib = {};

( function ( core, lib ) {
    "use strict";

    /**
     * API
     */

    $.fn.scrollable = function () {
        return getScrollable( this );
    };

    $.fn.scrollRange = function ( axis ) {
        var $container = lib.normalizeContainer( this );
        axis = axis ? lib.normalizeAxisName( axis ): lib.BOTH_AXES;
        return getScrollRange( $container, axis );
    };

    $.fn.scrollTo = function ( position, options ) {
        scrollTo( this, position, options );
        return this;
    };

    $.fn.stopScroll = function ( options ) {
        stopScroll( this, options );
        return this;
    };

    /**
     * Does the actual work of $.fn.scrollable.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
    function getScrollable ( $container ) {
        $container = lib.normalizeContainer( $container );
        return core.getScrollable( $container );
    }

    /**
     * Does the actual work of $.fn.scrollRange.
     *
     * @param   {jQuery} $container
     * @param   {string} axis
     * @returns {number|Object}
     */
    function getScrollRange( $container, axis ) {
        $container = lib.normalizeContainer( $container );
        axis = axis ? lib.normalizeAxisName( axis ) : lib.BOTH_AXES;

        return lib.getScrollMaximum( $container, axis );
    }

    /**
     * Does the actual work of $.fn.scrollTo.
     *
     * In jQuery fashion, animation callbacks (such as "start", "complete", etc) are bound to the animated element.
     * Please note that for window animations, the `this` of the callbacks is always set to the window, not the real
     * scrollable element (document element or body).
     *
     * @param {jQuery} $container
     * @param {number} position
     * @param {Object} [options]
     */
    function scrollTo ( $container, position, options ) {
        options = lib.normalizeOptions( options, position );
        $container = lib.normalizeContainer( $container );
        position = lib.normalizePosition( position, $container, options );

        if ( $.isWindow( $container[0] ) ) options = lib.bindAnimationCallbacks( options, $container[0] );

        if ( ! options.append ) stopScroll( $container, options );
        core.animateScroll( $container, position, options );
        // todo enforce final jump as a safety measure (by creating a new, aggregate done callback) - see Pagination.Views
    }

    /**
     * Does the actual work of $.fn.stopScroll.
     *
     * @param {jQuery}         $container
     * @param {Object}         [options]
     * @param {boolean}        [options.jumpToTargetPosition=false]
     * @param {string|boolean} [options.queue]                       usually not required, set to the scroll queue by default
     */
    function stopScroll( $container, options ) {
        $container = lib.normalizeContainer( $container );
        options = lib.normalizeOptions( options );
        lib.stopScrollAnimation( core.getScrollable( $container ), options );
    }

} )( core, lib );