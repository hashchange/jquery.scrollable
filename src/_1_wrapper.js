var mgr = {},
    lib = {},
    core = {};

( function ( mgr, lib ) {
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

    /**
     * Does the actual work of $.fn.scrollable.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
    function getScrollable ( $container ) {
        $container = lib.normalizeContainer( $container );
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
        $container = lib.normalizeContainer( $container );
        axis = axis ? lib.normalizeAxisName( axis ) : lib.BOTH_AXES;

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
        options = lib.normalizeOptions( options, position );
        $container = lib.normalizeContainer( $container );
        // In contrast to other arguments, the position is not normalized here. That has to wait because we need control
        // over the exact moment when the position is frozen into absolute numbers.

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
        $container = lib.normalizeContainer( $container );
        options = lib.normalizeOptions( options );
        mgr.stopScroll( $container, options );
    }

} )( mgr, lib );