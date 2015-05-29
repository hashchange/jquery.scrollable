// jQuery.scrollable, v0.1.0
// Copyright (c)2015 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/jquery.scrollable

;( function( $ ) {
    "use strict";

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
                queue: "scrollableQueue"
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
    /**
     * Core, option B:
     *
     * The scrollable element for a window is not detected. Instead, both possible candidates (document Element, body) are
     * animated.
     */
    
    ( function ( core, lib ) {
        "use strict";
    
        /**
         * Returns the scrollable element, in a jQuery wrapper. The container element is expected to be normalized.
         *
         * The return value of the method is determined as follows:
         *
         * - For ordinary elements, it returns the element itself.
         *
         * - For the window, it returns a set consisting of body and documentElement. Document, documentElement and body are
         *   considered to mean "window", and are treated the same.
         *
         * - For an iframe element, it returns body and documentElement of the iframe content window.
         *
         * If an empty jQuery set is passed in, an empty jQuery set is returned.
         *
         * @param   {jQuery} $container
         * @returns {jQuery}
         */
        core.getScrollable = function ( $container ) {
            return $.isWindow( $container[0] ) ? getWindowScrollable( $container[0] ) : $container;
        };
    
        /**
         * Animates the scroll movement. Container element and options are expected to be normalized.
         *
         * @param {jQuery} $container
         * @param {number} position
         * @param {Object} options
         */
        core.animateScroll = function ( $container, position, options ) {
    
            var $scrollable = core.getScrollable( $container );
    
            if ( $.isWindow( $container[0] ) ) {
                animateWindowScroll( $scrollable, position, options );
            } else {
                lib.addScrollAnimation( $scrollable, position, options );
            }
    
        };
    
    
        function animateWindowScroll ( $scrollable, position, options ) {
    
            var callbacks = lib.extractCallbacks( options ),
                calledInBodyContext = function () {
                    var elem = this;
                    return elem && elem.nodeName && elem.nodeName.toLowerCase() === "body";
                };
    
            // Here, we are mostly concerned with preventing callbacks from firing twice.
            //
            // We simply filter out the calls for one animated element and let them pass for the other. Which element? That
            // is an arbitrary choice. We cannot know the true scrollable element, so we just pick one. We go with "body"
            // here.
            //
            // Luckily for us, the choice of element doesn't matter. The callbacks are fired an identical number of times
            // for both elements, and they are passed the exact same data for each call, even though one of the elements
            // isn't animated at all.
            $.each( callbacks, function ( name, callback ) {
                options[name] = runIf( callback, calledInBodyContext );
            } );
    
            // Run the animation.
            lib.addScrollAnimation( $scrollable, position, options );
    
        }
    
        function getWindowScrollable ( currentWindow ) {
            return $( [ currentWindow.document.documentElement, currentWindow.document.body ] );
        }
    
        /**
         * Takes a function and returns a function which skips every other call. Even calls (2nd, 4th) are executed, while
         * the odd ones (1st call, 3rd etc) are dropped.
         *
         * The original function, when actually called, is passed all the arguments. It is executed in the global context
         * (window) unless it has been bound to a specific context prior to being passed in.
         *
         * @param {Function} fn
         */
        function skipOddCalls( fn ) {
    
            return (function ( count ) {
    
                count = 0;
                return function () {
                    count++;
                    if ( count % 2 === 0 ) fn.apply( undefined, arguments );
                };
    
            } )();
    
        }
    
        /**
         * Creates a wrapper function which executes a function if a test returns true.
         *
         * Both the target function and the test function are passed the arguments the wrapper is called with. They are also
         * invoked with the same context the wrapper is set to (window by default).
         *
         * If either the target function or the test function need a specific context which is different from the one in
         * runIf, they must be bound to that context before being passed in.
         *
         * @param   {Function} fn
         * @param   {Function} test
         * @returns {Function}
         */
        function runIf ( fn, test ) {
    
            return function () {
                if ( test.apply( this, arguments ) ) fn.apply( this, arguments );
            };
    
        }
    
    } )( core, lib );
    
    
    
    

}(
    typeof jQuery !== "undefined" ? jQuery : $
));