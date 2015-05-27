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
            axis: "vertical"
        };

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
     * - If the position is passed in as a hash, with both axes specified, the axis defaults to "both".
     * - If the position is passed in as a hash with just one axis specified, the axis defaults to "vertical" or
     *   "horizontal", depending on the position property.
     *
     * The options hash is normalized in the following ways:
     *
     * - It is converted to canonical axis names.
     *
     * Does not touch the original hash, returns a separate object instead.
     *
     * If no options hash is provided, the defaults are returned.
     *
     * @param   {Object|undefined}      options
     * @param   {number|string|Object}  position
     * @returns {Object}
     */
    lib.normalizeOptions = function ( options, position ) {

        var hasX, hasY,
            axisDefault = defaults.axis;

        options = options ? normalizeAxisProperty( options ) : {};

        if ( $.isPlainObject( position ) ) {
            position = normalizeAxisProperty( position );
            hasX = !isUndefinedPositionValue( position[ lib.HORIZONTAL ] ) && position[ lib.HORIZONTAL ] !== lib.IGNORE_AXIS;
            hasY = !isUndefinedPositionValue( position[ lib.VERTICAL ] ) && position[ lib.VERTICAL ] !== lib.IGNORE_AXIS;

            axisDefault = ( hasX && hasY ) ? lib.BOTH_AXES : hasX ? lib.HORIZONTAL : lib.VERTICAL;
        }

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
     * Delegates to lib.addAnimation otherwise. See there for more.
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
     * Sets up an animation for an element. Makes sure a custom queue works just as well as the default "fx" queue, ie
     * it auto-starts when necessary.
     *
     * If using a custom queue, all animations destined for that queue must be added with this method. It is safest to
     * simply add all animations with this method. It can process unqueued, immediate animations as well.
     *
     * DO NOT START A CUSTOM QUEUE MANUALLY (by calling dequeue()) WHEN USING THIS METHOD. That would dequeue and
     * execute the next queued item prematurely.
     *
     * @param {jQuery} $elem
     * @param {Object} properties  the animated property or properties, and their target value(s)
     * @param {Object} [options]   animation options
     */
    lib.addAnimation = function ( $elem, properties, options ) {
        var queueName = options && options.queue,
            isCustomQueue = isString( queueName ) && queueName !== "fx",
            sentinel = function ( next ) { next(); };

        $elem.animate( properties, options );

        // In a custom queue, add a sentinel function as the next item to the queue, in order to track the queue
        // progress.
        if ( isCustomQueue ) $elem.queue( queueName, sentinel );

        // Auto-start a custom queue if it is stuck.
        //
        // The telltale sign is that the new animation is still in the queue at index 0, hence its associated sentinel
        // is at index 1. That only happens if the queue is stuck. If the animation is merely waiting in line until
        // another animation finishes, it won't be waiting at index 0. That position is occupied by the sentinel of the
        // previous, ongoing animation.
        if ( isCustomQueue && $elem.queue( queueName )[1] === sentinel ) $elem.dequeue( queueName );
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
        var position,
            container = $container[0],
            isHorizontal = axis === lib.HORIZONTAL,
            queryProp = isHorizontal ? "scrollLeft": "scrollTop",
            windowQueryProp = isHorizontal ? "pageXOffset" : "pageYOffset";

        if ( $.isWindow( container ) ) {
            position = container[ windowQueryProp ];

            // In IE < 9, window.pageXOffset/window.pageYOffset is not defined (see MDN, https://goo.gl/pZLgfK). Perhaps
            // some odd mobile browsers lack support, too. If the query failed, fall back to checking body and document
            // element. Simply check both and take the maximum - the irrelevant one reports 0 anyway.
            if ( position === undefined ) {
                position = Math.max( container.document.body[ queryProp ], container.document.documentElement[ queryProp ] );
            }

        } else {
            position = container[ queryProp ];
        }

        return isNumber( position ) ? position :  parseFloat( position );
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