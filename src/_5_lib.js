( function ( lib, norm, queue ) {
    "use strict";

    /** @type {string[]}  names of all animation options which are callbacks */
    var animationCallbacks = [ "start", "complete", "done", "fail", "always", "step", "progress" ];

    /**
     * Returns the maximum position which can be scrolled to on a given axis. The container element is expected to be
     * normalized.
     *
     * When a single axis is queried, the result is returned as a number. When both axes are queried, a hash of both
     * axes is returned: { horizontal: ..., vertical: ... }.
     *
     * @param   {jQuery} $container
     * @param   {string} axis        "vertical", "horizontal", or "both"
     * @returns {number|Coordinates}
     */
    lib.getScrollMaximum = function ( $container, axis ) {

        var max, containerSize, contentSize,
            container = $container[0],
            _document = container.ownerDocument || container.document,
            isWindow = $.isWindow( container );

        if ( axis === norm.BOTH_AXES ) {

            max = {};
            max[ norm.HORIZONTAL ] = lib.getScrollMaximum( $container, norm.HORIZONTAL );
            max[ norm.VERTICAL ] = lib.getScrollMaximum( $container, norm.VERTICAL );

        } else {

            // We are measuring the true inner size of the container, excluding a horizontal or vertical scroll bar. The
            // appropriate property, for a window container as well as an ordinary element, is clientHeight/clientWidth.
            if ( axis === norm.HORIZONTAL ) {
                containerSize = isWindow ? _document.documentElement.clientWidth : container.clientWidth;
                contentSize = isWindow ? $.documentWidth( _document ) : container.scrollWidth;
            } else if ( axis === norm.VERTICAL ) {
                containerSize = isWindow ? _document.documentElement.clientHeight : container.clientHeight;
                contentSize = isWindow ? $.documentHeight( _document ) : container.scrollHeight;
            } else {
                throw new Error( "Unrecognized axis argument " + axis );
            }

            max = Math.max( contentSize - containerSize, 0 );
        }

        return max;

    };

    /**
     * Returns the owner window for a given element or document. If a window is passed in, the window itself is returned.
     *
     * In case an empty jQuery set is passed in, the method returns undefined.
     *
     * @param   {Window|Document|HTMLElement|jQuery} $elem
     * @returns {Window|undefined}
     */
    lib.ownerWindow = function ( $elem ) {
        var elem = $elem instanceof $ ? $elem[0] : $elem,
            ownerDocument = elem && ( elem.nodeType === 9 ? elem : elem.ownerDocument );

        return ownerDocument && ( ownerDocument.defaultView || ownerDocument.parentWindow ) || $.isWindow( elem ) && elem || undefined;
    };

    /**
     * Expects an object of animation options, deletes the callbacks in it and returns a new object consisting only of
     * the callbacks.
     *
     * Returns an empty object if the animation options are undefined, or if no callbacks are present in there.
     *
     * @param   {Object} [animationOptions]
     * @returns {Object|undefined}
     */
    lib.extractCallbacks = function ( animationOptions ) {
        var callbacks = {};

        if ( animationOptions ) {
            $.each( animationCallbacks, function ( index, name ) {
                var callback = animationOptions[name];
                if ( animationOptions[name] ) {
                    callbacks[name] = callback;
                    delete animationOptions[name];
                }
            } );
        }

        return callbacks;
    };

    /**
     * Expects an object of animation options and binds the callbacks ("start", "complete", etc) to the specified
     * element.
     *
     * Returns the modified options object. Does not modify the original object. Returns undefined if the animation
     * options are undefined.
     *
     * @param   {Object|undefined}   animationOptions
     * @param   {Window|HTMLElement} thisNode
     * @returns {Object|undefined}
     */
    lib.bindAnimationCallbacks = function ( animationOptions, thisNode ) {

        if ( animationOptions ) {

            animationOptions = $.extend( {}, animationOptions );

            $.each( animationCallbacks, function ( index, name ) {
                if ( animationOptions[name] ) animationOptions[name] = $.proxy( animationOptions[name], thisNode );
            } );

        }

        return animationOptions;

    };

    /**
     * Sets up a scroll animation for an element.
     *
     * Turns the position hash into a hash of properties to animate. The position is expected to be normalized.
     *
     * Delegates to lib.addAnimation and, implicitly, to queue.addToQueue otherwise. See there for more.
     *
     * @param {jQuery}      $elem
     * @param {Coordinates} position   the normalized position
     * @param {Object}      [options]  animation options
     */
    lib.addScrollAnimation = function ( $elem, position, options ) {
        var posX = position[ norm.HORIZONTAL ],
            posY = position[ norm.VERTICAL ],
            hasPosX = posX !== norm.IGNORE_AXIS,
            hasPosY = posY !== norm.IGNORE_AXIS,
            animated = {};

        if ( hasPosX ) animated.scrollLeft = posX;
        if ( hasPosY ) animated.scrollTop = posY;

        if ( hasPosX || hasPosY ) lib.addAnimation( $elem, animated, options );
    };

    /**
     * Sets up an animation for an element.
     *
     * Delegates to queue.addToQueue - see there for more.
     *
     * @param {jQuery} $elem
     * @param {Object} properties  the animated property or properties, and their target value(s)
     * @param {Object} [options]   animation options
     */
    lib.addAnimation = function ( $elem, properties, options ) {
        var config = {
            $elem: $elem,
            func: $.fn.animate,
            args: [ properties, options ],
            isAnimation: true,
            queue: options.queue
        };

        if ( options._proxyIsQueued ) {
            // A proxy for the animation has already been waiting in the queue. Its turn has come and it is executing
            // now, setting up the real animation. So run the animation next, don't send it back to the end of the
            // queue. (See proxyScrollTo in _2_mgr.js.)
            queue.runNextInQueue( config );
        } else {
            queue.addToQueue( config );
        }

    };

    /**
     * Stops an ongoing scroll animation and clears the queue of scroll animations. Optionally jumps to the targeted
     * position, rather than just stopping the scroll animation wherever it happens to be.
     *
     * Requires the actual scrollable element, as returned by $.fn.scrollable(). The options must have been normalized.
     *
     * Scroll animation queue
     * ----------------------
     *
     * The scrollTo animations use an animation queue of their own. For that reason, calling the generic jQuery method
     * $elem.stop() does not stop ongoing or queued scroll animations. You must use $elem.stopScroll() for these.
     *
     * Conversely, clearing the scroll animation queue does not affect other, non-scroll animations.
     *
     * Custom queues of your own
     * -------------------------
     *
     * If you have forced scrollTo to use a specific custom queue of your own, having called it with a `queue: "foo"`
     * option, then stopScroll must know about that queue. Pass the same `queue` option to stopScroll.
     *
     * If you have forced scrollTo to use the standard animation queue ("fx"), you must provide that option here, too.
     * In that case, stopScroll will stop and clear *all* animations in the default queue, not just scroll-related ones.
     *
     * @param {jQuery}         $scrollable
     * @param {Object}         [options]
     * @param {boolean}        [options.jumpToTargetPosition=false]
     * @param {string|boolean} [options.queue]
     */
    lib.stopScrollAnimation = function ( $scrollable, options ) {
        options = $.extend( { jumpToTargetPosition: false }, options );

        if ( options.queue === false ) {
            // Edge case: queue = false
            //
            // The original scroll animation may have been run outside of a queue context with { queue: false }. If the
            // same `queue: false` option is passed in here, just stop the currently ongoing animation, whatever that
            // may be.
            //
            // We can't target a scroll animation specifically, so it is a bit of a gamble - but the queue option
            // shouldn't have been set to false in the first place.
            //
            // Stick to the standard scroll queue as a best practice (ie, simply don't specify a queue, and all will be
            // well). Manage that queue implicitly with the `append` option of $.fn.scrollTo, or perhaps call
            // $.fn.stopScroll explicitly when really necessary, and leave it at that.

            $scrollable.stop( true, options.jumpToTargetPosition );
        } else {
            $scrollable.stop( options.queue, true, options.jumpToTargetPosition );
        }

    };

    lib.isString = function ( value ) {
        return typeof value === 'string' || value instanceof String;
    };

    lib.isNumber = function ( value ) {
        return ( typeof value === 'number' || value instanceof Number ) && ! isNaN( value );
    };

    lib.isInArray = function ( value, arr ) {
        return $.inArray( value, arr ) !== -1;
    };

} )( lib, norm, queue );