var mgr = {},
    norm = {},
    queue = {},
    lib = {},
    core = {};

( function ( mgr, norm ) {
    "use strict";

    /**
     * API
     */

    $.fn.scrollable = function () {
        return getScrollable( this );
    };

    $.fn.scrollRange = function ( axis ) {
        return getScrollRange( this, axis );
    };

    $.fn.scrollTo = function ( position, options ) {
        scrollTo( this, position, options );
        return this;
    };

    $.fn.stopScroll = function ( options ) {
        stopScroll( this, options );
        return this;
    };

    $.scrollable = {
        userScrollThreshold: 5,
        _enableUserScrollDetection: true
    };

    /**
     * Does the actual work of $.fn.scrollable.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
    function getScrollable ( $container ) {
        $container = norm.normalizeContainer( $container );
        return mgr.getScrollable( $container );
    }

    /**
     * Does the actual work of $.fn.scrollRange.
     *
     * @param   {jQuery} $container
     * @param   {string} axis
     * @returns {number|Object}
     */
    function getScrollRange( $container, axis ) {
        $container = norm.normalizeContainer( $container );
        axis = axis ? norm.normalizeAxisName( axis ) : norm.BOTH_AXES;

        return mgr.getScrollRange( $container, axis );
    }

    /**
     * Does the actual work of $.fn.scrollTo.
     *
     * @param {jQuery}               $container
     * @param {number|string|Object} position
     * @param {Object}               [options]
     */
    function scrollTo ( $container, position, options ) {
        options = norm.normalizeOptions( options, position );
        $container = norm.normalizeContainer( $container );
        position = norm.normalizePosition( position, $container, mgr.getScrollable( $container ), options );

        mgr.scrollTo( $container, position, options );
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
        $container = norm.normalizeContainer( $container );
        options = norm.normalizeOptions( options );
        mgr.stopScroll( $container, options );
    }

} )( mgr, norm );