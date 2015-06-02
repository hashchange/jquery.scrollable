( function ( lib ) {
    "use strict";

    /** @type {string[]}  names of all animation options which are callbacks */
    var animationCallbacks = [ "start", "complete", "done", "fail", "always", "step", "progress" ],

        /** @type {string[]}  non-canonical but recognized names for the vertical axis */
        altAxisNamesV = [ "v", "y", "top" ],

        /** @type {string[]}  non-canonical but recognized names for the horizontal axis */
        altAxisNamesH = [ "h", "x", "left" ],

        /** @type {string[]}  non-canonical but recognized names for both axes */
        altAxisNamesBoth = [ "vh", "hv", "xy", "yx", "all" ],

        /** @type {string[]}  all non-canonical but recognized names for one or both axes */
        altAxisNames = altAxisNamesV.concat( altAxisNamesH, altAxisNamesBoth ),

        /** @type {Object}  default scroll options */
        defaults = {
            axis: "vertical",
            queue: "internal.jquery.scrollable"
        },

        /** @type {Function[]}  jQuery effects functions which have a custom queue option and take the options hash as first argument */
        jqEffectsWithOptionsArg1 = getJQueryFunctions( [
            "fadeIn", "fadeOut", "fadeToggle", "hide", "show", "slideDown", "slideToggle", "slideUp", "toggle"
        ] ),

        /** @type {Function[]}  jQuery effects functions which have a custom queue option and take the options hash as second argument */
        jqEffectsWithOptionsArg2 = getJQueryFunctions( [ "animate" ] ),

        /** @type {Function[]}  jQuery effects functions which have a custom queue option and take the options name (string) as second argument */
        jqEffectsWithStringArg2 = getJQueryFunctions( [ "delay" ] ),

        /** @type {Function[]}  jQuery effects functions which don't have a custom queue option */
        jqEffectsFxQueueOnly = getJQueryFunctions( [ "fadeTo" ] ),

        /** @type {Function[]}  jQuery effects functions which add themselves to the queue automatically */
        jQueryEffects = jqEffectsWithOptionsArg1.concat( jqEffectsWithOptionsArg2, jqEffectsWithStringArg2, jqEffectsFxQueueOnly );


    /** @type {string}  canonical name for the vertical axis */
    lib.VERTICAL = "vertical";

    /** @type {string}  canonical name for the horizontal axis */
    lib.HORIZONTAL = "horizontal";

    lib.BOTH_AXES = "both";

    /** @type {number}  scroll position value signalling that the axis should not be scrolled */
    lib.IGNORE_AXIS = -999;


    /**
     * Normalizes the container element, if it relates to a window. Other elements are returned unchanged.
     *
     * - It maps `documentElement` and `body` to the window.
     * - It maps an iframe element to its content window.
     * - It returns other elements unchanged.
     * - It returns an empty jQuery set as is.
     *
     * Elements are expected in a jQuery wrapper, and are returned in a jQuery wrapper.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
    lib.normalizeContainer = function ( $container ) {
        var container = $container[0],
            tagName = container && container.tagName && container.tagName.toLowerCase(),
            isIframe = tagName === "iframe",
            isWindow = !tagName || tagName === "html" || tagName === "body";

        return isWindow ? $( lib.ownerWindow( container ) ) : isIframe ? $( container.contentWindow ) : $container;
    };

    /**
     * Returns a hash of scroll positions. The position on each axis is normalized to a number (in px) and limited to
     * the available scroll range. If the position is passed in as a hash, the axis properties are normalized to their
     * canonical names as well ("horizontal"/"vertical").
     *
     * The container element is expected to be normalized. So is the options hash.
     *
     * If a position hash is passed in, one axis can be left undefined if it shouldn't be scrolled (e.g.
     * { vertical: 100 } - note the missing horizontal dimension). Null or "" are treated the same as undefined.
     *
     * If only one axis is to be scrolled (as specified by the options or the position hash), the other one is set to
     * lib.IGNORE_AXIS in the returned hash.
     *
     * If a hash has been passed in, that original hash remains untouched. A separate object is returned.
     *
     * Percentages are calculated in relation to container size. A simple percentage string is calculated for vertical
     * scroll, ie relative to container height, unless the axis option says otherwise. For a hash, percentages are
     * applied per axis.
     *
     * The normalization of values works as follows:
     *
     * - A number is returned as is.
     * - A string ending in "px" is turned into a number.
     * - A string ending in "%" is converted to its px value, relative to container size on the specified axis.
     * - A string "top" or "left" is converted to 0.
     * - A string "bottom", "right" is converted to the maximum scroll value on the respective axis.
     * - A string prefixed with "+=" or "-=", which means that the position is relative to the current scroll position,
     *   is turned into an absolute position.
     * - Hash properties "v"/"h", "y"/"x" are converted into "vertical"/"horizontal" properties.
     * - Hash property values are converted according to the rules for primitives.
     * - Missing hash properties are filled in with lib.IGNORE_AXIS.
     *
     * @param {number|string|Object} position
     * @param {jQuery}               $container
     * @param {Object}               options     must have the axis property set (which is the case in a normalized
     *                                           options object)
     * @returns {Coordinates}
     */
    lib.normalizePosition = function ( position, $container, options ) {

        var otherAxis, prefix,
            origPositionArg = position,
            basePosition = 0,
            sign = 1,
            axis = options.axis,
            normalized = {};

        if ( $.isPlainObject( position ) ) {

            position = normalizeAxisProperty( position );
            normalized[ lib.HORIZONTAL ] = axis === lib.VERTICAL ? lib.IGNORE_AXIS : lib.normalizePosition( position[ lib.HORIZONTAL ], $container, { axis: lib.HORIZONTAL } )[ lib.HORIZONTAL ];
            normalized[ lib.VERTICAL ] = axis === lib.HORIZONTAL ? lib.IGNORE_AXIS : lib.normalizePosition( position[ lib.VERTICAL ], $container, { axis: lib.VERTICAL } )[ lib.VERTICAL ];

        } else {

            // Working in one dimension only. We need a precise statement of the axis (axis: "both" is not enough here -
            // we need to know which one).
            if ( ! ( axis === lib.HORIZONTAL || axis === lib.VERTICAL ) ) throw new Error( "Axis option not defined, or not defined unambiguously, with current value " + axis );

            // Convert string input to number
            if ( isString( position ) ) {

                position = position.toLowerCase();

                // Deal with +=, -= relative position prefixes
                prefix = position.slice( 0, 2 );
                if ( prefix === "+=" || prefix === "-=" ) {
                    position = position.slice( 2 );
                    sign = prefix === "+=" ? 1 : -1;
                    basePosition = getCurrentScrollPosition( $container, axis );
                }

                // Resolve px, % units
                if ( position.slice( -2 ) === "px" ) {
                    position = parseFloat( position.slice( 0, -2 ) );
                } else if ( position.slice( -1 ) === "%" ) {
                    position = parseFloat( position.slice( 0, -1 ) ) * lib.getScrollMaximum( $container, axis ) / 100;
                } else {

                    // Resolve position strings
                    if ( axis === lib.HORIZONTAL ) {

                        if ( position === "left" ) position = 0;
                        if ( position === "right" ) position = lib.getScrollMaximum( $container, axis );
                        if ( position === "top" || position === "bottom" ) throw new Error( "Desired position " + position + "is inconsistent with axis option " + axis );

                    } else {

                        if ( position === "top" ) position = 0;
                        if ( position === "bottom" ) position = lib.getScrollMaximum( $container, axis );
                        if ( position === "left" || position === "right" ) throw new Error( "Desired position " + position + "is inconsistent with axis option " + axis );

                    }

                }

                // Convert any remaining numeric string (e.g. "100") to a number
                if ( isString( position ) && $.isNumeric( position ) ) position = parseFloat( position );

            }

            if ( isNumber( position ) ) {

                // Calculate the absolute position. Explicit rounding is required because scrollTop/scrollLeft cuts off
                // fractional pixels, rather than rounding them.
                position = Math.round( basePosition + sign * position );
                normalized[ axis ] = limitToScrollRange( position, $container, axis );

            } else if ( isUndefinedPositionValue( position ) ) {
                normalized[ axis ] = lib.IGNORE_AXIS;
            } else {
                // Invalid position value
                throw new Error( "Invalid position argument " + origPositionArg );
            }

            // Single axis here, hence the other axis is not dealt with - set to "ignore axis"
            otherAxis = axis === lib.HORIZONTAL ? lib.VERTICAL : lib.HORIZONTAL;
            normalized[ otherAxis ] = lib.IGNORE_AXIS;

        }

        return normalized;

    };

    /**
     * Normalizes the options hash and applies the defaults. Does NOT expect the position argument to be normalized.
     *
     * The requested scroll position is required as an argument because the axis default depends on the position format:
     *
     * - If the position is passed in as a primitive (single axis), the axis defaults to "vertical".
     * - If the position is passed in as a primitive but has an implicit axis, that axis becomes the default (positions
     *   "top", "bottom", "left", "right")
     * - If the position is passed in as a hash, with both axes specified, the axis defaults to "both".
     * - If the position is passed in as a hash with just one axis specified, the axis defaults to "vertical" or
     *   "horizontal", depending on the position property.
     *
     * The options hash is normalized in the following ways:
     *
     * - It is converted to canonical axis names.
     * - The `queue` property is filled in with its default value, unless a queue is provided explicitly.
     *
     * Does not touch the original hash, returns a separate object instead.
     *
     * If no options hash is provided, the defaults are returned.
     *
     * @param   {Object|undefined}      options
     * @param   {number|string|Object}  [position]  you can omit the position when not dealing with axes, e.g. when
     *                                              handling stopScroll options
     * @returns {Object}
     */
    lib.normalizeOptions = function ( options, position ) {

        var hasX, hasY,
            axisDefault = defaults.axis;

        // Normalize the axis property names
        options = options ? normalizeAxisProperty( options ) : {};

        // Determine the axis default value
        if ( $.isPlainObject( position ) ) {

            position = normalizeAxisProperty( position );
            hasX = !isUndefinedPositionValue( position[ lib.HORIZONTAL ] ) && position[ lib.HORIZONTAL ] !== lib.IGNORE_AXIS;
            hasY = !isUndefinedPositionValue( position[ lib.VERTICAL ] ) && position[ lib.VERTICAL ] !== lib.IGNORE_AXIS;

            axisDefault = ( hasX && hasY ) ? lib.BOTH_AXES : hasX ? lib.HORIZONTAL : lib.VERTICAL;

        } else if ( isString( position ) ) {

            position = position.toLowerCase();

            if ( position === "top" || position === "bottom" ) {
                axisDefault = lib.VERTICAL;
            } else if ( position === "left" || position === "right" ) {
                axisDefault = lib.HORIZONTAL;
            }

        }

        // Apply defaults where applicable
        return $.extend( {}, defaults, { axis: axisDefault }, options );

    };

    /**
     * Accepts any of the recognized names for an axis and returns the canonical axis name.
     *
     * Throws an error if the argument is not recognized as an axis name.
     *
     * @param   {string} name
     * @returns {string}
     */
    lib.normalizeAxisName = function ( name ) {

        if ( isInArray( name, altAxisNamesV ) ) {
            name = lib.VERTICAL;
        } else if ( isInArray( name, altAxisNamesH ) ) {
            name = lib.HORIZONTAL;
        } else if ( isInArray( name, altAxisNamesBoth ) ) {
            name = lib.BOTH_AXES;
        }

        if ( ! ( name === lib.VERTICAL || name === lib.HORIZONTAL || name === lib.BOTH_AXES ) ) throw new Error( "Invalid axis name " + name );

        return name;

    };

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

        if ( axis === lib.BOTH_AXES ) {

            max = {};
            max[ lib.HORIZONTAL ] = lib.getScrollMaximum( $container, lib.HORIZONTAL );
            max[ lib.VERTICAL ] = lib.getScrollMaximum( $container, lib.VERTICAL );

        } else {

            // We are measuring the true inner size of the container, excluding a horizontal or vertical scroll bar. The
            // appropriate property, for a window container as well as an ordinary element, is clientHeight/clientWidth.
            if ( axis === lib.HORIZONTAL ) {
                containerSize = isWindow ? _document.documentElement.clientWidth : container.clientWidth;
                contentSize = isWindow ? $.documentWidth( _document ) : container.scrollWidth;
            } else if ( axis === lib.VERTICAL ) {
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
     * Delegates to lib.addAnimation and, implicitly, to lib.addToQueue otherwise. See there for more.
     *
     * @param {jQuery}      $elem
     * @param {Coordinates} position   the normalized position
     * @param {Object}      [options]  animation options
     */
    lib.addScrollAnimation = function ( $elem, position, options ) {
        var posX = position[ lib.HORIZONTAL ],
            posY = position[ lib.VERTICAL ],
            hasPosX = posX !== lib.IGNORE_AXIS,
            hasPosY = posY !== lib.IGNORE_AXIS,
            animated = {};

        if ( hasPosX ) animated.scrollLeft = posX;
        if ( hasPosY ) animated.scrollTop = posY;

        if ( hasPosX || hasPosY ) lib.addAnimation( $elem, animated, options );
    };

    /**
     * Sets up an animation for an element.
     *
     * Delegates to lib.addToQueue - see there for more.
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
            lib.runNextInQueue( config );
        } else {
            lib.addToQueue( config );
        }

    };

    /**
     * Adds a function to a queue. Makes sure the internal custom queue for scrolling works just as well as the default
     * "fx" queue, ie it auto-starts when necessary.
     *
     * When using the internal custom queue, all animations destined for that queue must be added with this method. It
     * is safest to simply add **all** animations with this method. It can process unqueued, immediate animations as
     * well.
     *
     * DO NOT START THE INTERNAL CUSTOM QUEUE MANUALLY (by calling dequeue()) WHEN USING THIS METHOD. That is taken care
     * of here. Manual intervention would dequeue and execute the next queued item prematurely.
     *
     * ATTN Arguments format:
     *
     * Some built-in jQuery effects functions accept arguments in more than one format. Only the format using an options
     * hash is supported here, e.g `.animate( properties, options )`. The options argument cannot be omitted, and it
     * must be normalized. For `animate`, that means that config.args must be set to `[ properties, options ]`.
     *
     * For functions which are not jQuery effects, arguments can be whatever you like.
     *
     * @param {Object}   config
     * @param {jQuery}   config.$elem         the animated element which the queue is attached to
     * @param {Function} config.func          the "payload" function to be executed; invoked in the context of config.$elem
     * @param {Array}    config.args          of config.func
     * @param {string}   [config.queue="fx"]
     */
    lib.addToQueue = function ( config ) {

        var $elem = config.$elem,
            func = config.func,
            args = config.args,

            queueName = config.queue !== undefined ? config.queue : "fx",
            isInternalCustomQueue = queueName === defaults.queue && queueName !== "fx",

            sentinel = function ( next ) { next(); };

        if ( isQueueable( func ) ) {
            // Dealing with an animation-related jQuery function which adds itself to the queue automatically.
            //
            // First, force it to use the specified queue (in case there is an inconsistency). Choose the right
            // arguments format for the function at hand.
            if ( isInArray( func, jqEffectsWithOptionsArg1 ) ) {
                $.extend( args[0], { queue: queueName } );
            } else if ( isInArray( func, jqEffectsWithOptionsArg2 ) ) {
                $.extend( args[1], { queue: queueName } );
            } else if ( isInArray( func, jqEffectsWithStringArg2 ) ) {
                args[1] = queueName;
            } else {
                // Dealing with an effects function which only works in the "fx" queue. (At the time of writing, that
                // was $.fn.fadeTo only.)
                if ( queueName !== "fx" ) throw new Error( "Can't use a custom queue (queue name: '" + queueName + "') with the provided animation function" );
            }

            // Then just run the animation, it is added to the queue automatically
            func.apply( $elem, args );
        } else {
            // The "payload" is an ordinary function, so create a wrapper to put the function into the queue
            $elem.queue( queueName, function ( next ) {
                func.apply( $elem, args );
                next();
            } );
        }

        // In the internal custom queue, add a sentinel function as the next item to the queue, in order to track the
        // queue progress.
        if ( isInternalCustomQueue ) $elem.queue( queueName, sentinel );

        // Auto-start the internal custom queue if it is stuck.
        //
        // The telltale sign is that the new animation is still in the queue at index 0, hence its associated sentinel
        // is at index 1. That only happens if the queue is stuck. If the animation is merely waiting in line until
        // another animation finishes, it won't be waiting at index 0. That position is occupied by the sentinel of the
        // previous, ongoing animation.
        if ( isInternalCustomQueue && $elem.queue( queueName )[1] === sentinel ) $elem.dequeue( queueName );

    };

    /**
     * Adds a function to the queue so that it will be executed next. If another queue item is currently in process, the
     * added function runs as soon as the current one has finished.
     *
     * @param {Object}   config
     * @param {jQuery}   config.$elem         the animated element which the queue is attached to
     * @param {Function} config.func          the "payload" function to be executed; invoked in the context of config.$elem
     * @param {Array}    config.args          of config.func
     * @param {string}   [config.queue="fx"]
     */
    lib.runNextInQueue = function ( config ) {

        var insertAt, isNext, queueContent, moveThis,
            $elem = config.$elem,
            queueName = config.queue !== undefined ? config.queue : "fx",

            isFxQueue = queueName === "fx",
            isInternalCustomQueue = queueName === defaults.queue && !isFxQueue,
            queueLength = $elem.queue( queueName ).length;

        // Check where the next slot in the queue would be, after having accounted for the currently running animation
        // (if any) and sentinel placeholders.
        //
        // - In the fx queue, the first item is always the one in progress. (An "inprogress" placeholder shows up in the
        //   queue.) The next queue slot is either 0 (empty queue, no animation running) or 1 (queue not empty,
        //   animation in progress).
        //
        // - A custom queue behaves differently. The animation in progress is not visible in the queue. Hence, in an
        //   unmanaged custom queue, the next slot is always 0.
        //
        // - In the internal (managed) custom queue, additions to the queue appear in pairs. The animation (or other
        //   "payload") is always accompanied by a sentinel, which aids tracking the queue progress.
        //
        //   If an animation is in progress, it has popped off the queue (custom queue behaviour), and slot 0 is
        //   occupied by the associated sentinel. The next queue slot is either 0 (empty queue, no animation running) or
        //   1 (queue not empty, animation in progress). In that regard, the managed queue behaves the same as the fx
        //   queue.
        //
        // That's reasonably straightforward so far. In a custom queue, though, we might run into a scenario where the
        // queue is stuck (because it does not start automatically). Lets look at the implications.
        //
        // - The stuck animation should be considered "in progress but derailed". With runNextInQueue, we don't want to
        //   jump ahead of an animation which is (or at least should be considered to be) already in progress. The slot
        //   we are targeting is actually behind the stuck animation, not in front of it.
        //
        // - The internal, managed queue never gets stuck, though. All additions are run through lib.addToQueue, which
        //   implements auto start.
        //
        // - A user-defined custom queue might get stuck, but we have no way of knowing whether it is. Without sentinels,
        //   we can't tell if an animation in slot 0 is derailed and stuck or orderly waiting in a progressing queue. It
        //   is up to the user to keep the queue going, and we just have to assume that he or she didn't screw up.
        //
        // In a nutshell: we don't have to deal with a stuck queue here.
        //
        // (A demo for inspecting the behaviour of queues is at http://output.jsbin.com/tudufi/2/)

        insertAt = ( isFxQueue || isInternalCustomQueue ) ? Math.min( queueLength, 1 ) : 0;

        // Check if the new function would be up next anyway. In that case, we can simply append it to the queue and
        // skip the whole queue rearrangement dance.
        isNext = queueLength < ( insertAt + 1 );

        // Append the animation or function to the queue, so that we can extract the corresponding queue items (with
        // queue wrappers around the actual payload).
        lib.addToQueue( config );

        // Rearrange the queue if necessary
        if ( ! isNext ) {
            queueContent = $elem.queue( queueName );

            // In the internal custom queue, we must move the associated sentinel as well
            moveThis = isInternalCustomQueue ? queueContent.splice( - 2 ) : queueContent.splice( -1 );
            insertArrayIntoArray( queueContent, moveThis, insertAt );

            $elem.queue( queueName, queueContent );
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

    /**
     * Makes sure the position is within the range which can be scrolled to. The container element is expected to be
     * normalized.
     *
     * @param   {number} position
     * @param   {jQuery} $container
     * @param   {string} axis        "vertical" or "horizontal"
     * @returns {number}
     */
    function limitToScrollRange ( position, $container, axis ) {

        position = Math.min( position, lib.getScrollMaximum( $container, axis ) );
        position = Math.max( position, 0 );

        return position;

    }

    /**
     * Returns the current scroll position for a container on a given axis. The container element is expected to be
     * normalized.
     *
     * @param   {jQuery} $container
     * @param   {string} axis        "vertical" or "horizontal"
     * @returns {number}
     */
    function getCurrentScrollPosition( $container, axis ) {
        return axis === lib.HORIZONTAL ? $container.scrollLeft() : $container.scrollTop();
    }

    /**
     * Takes a hash of options or positions and returns a copy, with axis names normalized.
     *
     * @param   {Object} inputHash
     * @returns {Object}
     */
    function normalizeAxisProperty ( inputHash ) {
        var normalized = {};

        $.each( inputHash, function ( key, value ) {
            if ( isInArray( key, altAxisNames ) ) {
                normalized[ lib.normalizeAxisName(key) ] = value;
            } else {
                normalized[ key ] = value;
            }
        } );

        return normalized;
    }

    /**
     * Inserts the items in one array into another array, at a specified index. Does NOT return the result, but rather
     * MODIFIES the target array IN PLACE!
     *
     * @param {Array}  insertInto  the target array
     * @param {Array}  insertThis  the array containing the items which are to be inserted
     * @param {number} insertAt    index
     */
    function insertArrayIntoArray ( insertInto, insertThis, insertAt ) {
        insertInto.splice.apply( insertInto, [ insertAt, 0 ].concat( insertThis ) );
    }

    /**
     * Returns if a position value is considered undefined. That is the case when it is set to undefined, null, false,
     * or an empty string.
     *
     * ATTN For primitive values only. Does NOT deal with a position hash!
     *
     * @param   {number|string|boolean|null|undefined} positionValue
     * @returns {boolean}
     */
    function isUndefinedPositionValue ( positionValue ) {
        return positionValue === undefined || positionValue === null || positionValue === false || positionValue === "";
    }

    /**
     * Returns an array of jQuery functions, based on their names.
     *
     * The result contains only functions which actually exist in the loaded version of jQuery.
     *
     * @param   {string[]} names
     * @returns {Function[]}
     */
    function getJQueryFunctions ( names ) {
        return $.grep(

            $.map( names, function ( name ) {
                return $.fn[name];
            } ),

            function ( func ) { return !!func; }

        );
    }

    /**
     * Returns whether a function adds itself to a queue automatically. That is the case for $.fn.animate or other
     * jQuery animation functions, such as $.fn.delay, $.fn.show etc.
     *
     * The list of recognized functions has to be maintained by hand, there is no generic approach here.
     *
     * @param   {Function} func
     * @returns {boolean}
     */
    function isQueueable ( func ) {
        return isInArray( func, jQueryEffects );
    }

    function isString ( value ) {
        return typeof value === 'string' || value instanceof String;
    }

    function isNumber ( value ) {
        return ( typeof value === 'number' || value instanceof Number ) && ! isNaN( value );
    }

    function isInArray( value, arr ) {
        return $.inArray( value, arr ) !== -1;
    }

    /**
     * Custom types.
     *
     * For easier documentation and type inference.
     */

    /**
     * @name  Coordinates
     * @type  {Object}
     *
     * @property {number}  horizontal
     * @property {number}  vertical
     */

} )( lib );