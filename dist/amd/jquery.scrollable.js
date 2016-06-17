// jQuery.scrollable, v1.2.1
// Copyright (c) 2015-2016 Michael Heim, Zeilenwechsel.de
// Distributed under MIT license
// http://github.com/hashchange/jquery.scrollable

;( function ( root, factory ) {
    "use strict";

    if ( typeof exports === 'object' ) {

        module.exports = factory(
            require( 'jquery' ),
            require( 'jquery.documentsize' )
        );

    } else if ( typeof define === 'function' && define.amd ) {

        define( [
            'jquery',
            'jquery.documentsize'
        ], factory );

    }
}( this, function ( jQuery ) {
    "use strict";

    ;( function( $ ) {
        "use strict";
    
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
        
            $.fn.notifyScrollCallbacks = function ( message, callbackNames, queueName ) {
                notifyScrollCallbacks( this, message, callbackNames, queueName );
                return this;
            };
        
            $.scrollable = {
                lockSpeedBelow: 400,
                defaultDuration: $.fx.speeds._default,
        
                userScrollThreshold: 10,
        
                // Internal config. Do not modify in production.
                _scrollDetectionThreshold: 5,
                _enableUserScrollDetection: !isIOS(),
                _enableClickAndTouchDetection: true,
                _useScrollHistoryForDetection: isIOS()
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
             * @param {Object}         [options.notifyCancelled]
             * @param {string|boolean} [options.queue]                       usually not required, set to the scroll queue by default
             */
            function stopScroll( $container, options ) {
                $container = norm.normalizeContainer( $container );
                options = norm.normalizeOptions( options );
                mgr.stopScroll( $container, options );
            }
        
            /**
             * Does the actual work of $.fn.notifyScrollCallbacks.
             *
             * @param {jQuery}          $container
             * @param {Object}          message
             * @param {string|string[]} [callbackNames]  defaults to all exit callbacks ("complete", "done", "fail", "always")
             * @param {string}          [queueName]      usually not required, set to the scroll queue by default
             */
            function notifyScrollCallbacks ( $container, message, callbackNames, queueName ) {
                $container = norm.normalizeContainer( $container );
                if ( callbackNames !== undefined && !$.isArray( callbackNames ) ) callbackNames = [callbackNames];
                mgr.notifyScrollCallbacks( $container, message, callbackNames, queueName );
            }
        
            /**
             * Detects if the browser is on iOS. Works for Safari as well as other browsers, say, Chrome on iOS.
             *
             * Required for some iOS behaviour which can't be feature-detected in any way.
             *
             * @returns {boolean}
             */
            function isIOS () {
                return (/iPad|iPhone|iPod/gi).test( navigator.userAgent );
            }
        
        } )( mgr, norm );
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
        ( function ( norm, lib, queue ) {
            "use strict";
        
            /** @type {string[]}  non-canonical but recognized names for the vertical axis */
            var altAxisNamesV = [ "v", "y", "top" ],
        
                /** @type {string[]}  non-canonical but recognized names for the horizontal axis */
                altAxisNamesH = [ "h", "x", "left" ],
        
                /** @type {string[]}  non-canonical but recognized names for both axes */
                altAxisNamesBoth = [ "vh", "hv", "xy", "yx", "all" ],
        
                /** @type {string[]}  all non-canonical but recognized names for one or both axes */
                altAxisNames = altAxisNamesV.concat( altAxisNamesH, altAxisNamesBoth );
        
            /** @type {string}  canonical name for the vertical axis */
            norm.VERTICAL = "vertical";
        
            /** @type {string}  canonical name for the horizontal axis */
            norm.HORIZONTAL = "horizontal";
        
            /** @type {string}  canonical name for both axes */
            norm.BOTH_AXES = "both";
        
            /** @type {number}  scroll position value signalling that the axis should not be scrolled */
            norm.IGNORE_AXIS = -999;
        
            /** @type {Object}  default scroll options (hard-coded, not configurable) */
            norm.defaults = {
                // Identifier for an options object belonging to jQuery.scrollable
                _jqScrollable: true,
        
                axis: norm.VERTICAL,
                queue: "internal.jquery.scrollable",
                ignoreUser: false
            };
        
            /** @type {string}  ignoreUser option value for ignoring scroll only */
            norm.IGNORE_USER_SCROLL_ONLY = "scroll";
        
            /** @type {string}  ignoreUser option value for ignoring clicks and touch only */
            norm.IGNORE_USER_CLICK_TOUCH_ONLY = "click";
        
            /** @type {string}  "replace" mode flag for chained scrollTo calls */
            norm.MODE_REPLACE = "replace";
        
            /** @type {string}  "append" mode flag for chained scrollTo calls */
            norm.MODE_APPEND = "append";
        
            /** @type {string}  "merge" mode flag for chained scrollTo calls */
            norm.MODE_MERGE = "merge";
        
        
            /**
             * Normalizes the container element, if it relates to a window. Other elements are returned unchanged.
             *
             * - It maps `document`, `documentElement` and `body` to the window.
             * - It maps an iframe element to its content window.
             * - It returns other elements unchanged.
             * - It returns an empty jQuery set as is.
             *
             * Elements are expected in a jQuery wrapper, and are returned in a jQuery wrapper.
             *
             * @param   {jQuery} $container
             * @returns {jQuery}
             */
            norm.normalizeContainer = function ( $container ) {
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
             * norm.IGNORE_AXIS in the returned hash.
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
             *   is turned into an absolute position. If the scroll is appended or merged, the move is based on the position
             *   which the preceding scroll will arrive at, rather than the current position.
             * - Hash properties "v"/"h", "y"/"x" are converted into "vertical"/"horizontal" properties.
             * - Hash property values are converted according to the rules for primitives.
             * - Missing hash properties are filled in with norm.IGNORE_AXIS.
             *
             * @param {number|string|Object} position
             * @param {jQuery}               $container
             * @param {jQuery}               $scrollable
             * @param {Object}               options     must have the axis and queue property set (which is the case in a
             *                                           normalized options object)
             * @returns {Coordinates}
             */
            norm.normalizePosition = function ( position, $container, $scrollable, options ) {
        
                var queueWrapper = new queue.QueueWrapper( $scrollable, options.queue );
        
                if ( $.isPlainObject( position ) ) {
                    return normalizePositionForHash( position, $container, options, queueWrapper );
                } else {
                    return normalizePositionForAxis( position, $container, options, queueWrapper );
                }
            };
        
            /**
             * Normalizes a position hash.
             *
             * Delegates to normalizePositionForAxis(). For info, see norm.normalizePosition().
             *
             * @param   {Object}             position
             * @param   {jQuery}             $container
             * @param   {Object}             options       must have the axis property set (which is the case in a normalized
             *                                             options object)
             * @param   {queue.QueueWrapper} queueWrapper
             * @returns {Coordinates}
             */
            function normalizePositionForHash ( position, $container, options, queueWrapper ) {
        
                var axis = options.axis,
                    pos = normalizeAxisProperty( position ),
                    posX = pos[norm.HORIZONTAL],
                    posY = pos[norm.VERTICAL],
                    ignoreX = axis === norm.VERTICAL,
                    ignoreY = axis === norm.HORIZONTAL,
                    optionsX = $.extend( {}, options, { axis: norm.HORIZONTAL } ),
                    optionsY = $.extend( {}, options, { axis: norm.VERTICAL } ),
                    normalized = {};
        
                // NB Merge mode: if an axis is ignored in the current scroll operation, a target may nevertheless be inherited
                // from previous, unfinished scrollTo commands. Read it from the queue then.
                normalized[norm.HORIZONTAL] = ignoreX ?
                                              ( options.merge ? lib.getLastTarget_QW( queueWrapper, norm.HORIZONTAL ) : norm.IGNORE_AXIS ) :
                                              normalizePositionForAxis( posX, $container, optionsX, queueWrapper )[norm.HORIZONTAL];
                normalized[norm.VERTICAL] = ignoreY ?
                                            ( options.merge ? lib.getLastTarget_QW( queueWrapper, norm.VERTICAL ) : norm.IGNORE_AXIS ) :
                                            normalizePositionForAxis( posY, $container, optionsY, queueWrapper )[norm.VERTICAL];
        
                return normalized;
            }
        
            /**
             * Normalizes a numeric or string position.
             *
             * For info, see norm.normalizePosition().
             *
             * @param   {number|string}      position
             * @param   {jQuery}             $container
             * @param   {Object}             options       must have the axis property set (which is the case in a normalized
             *                                             options object)
             * @param   {queue.QueueWrapper} queueWrapper
             * @returns {Coordinates}
             */
            function normalizePositionForAxis ( position, $container, options, queueWrapper ) {
        
                var otherAxis, prefix,
                    origPositionArg = position,
                    basePosition = 0,
                    sign = 1,
                    axis = options.axis,
                    scrollMode = norm.getScrollMode( options ),
                    normalized = {};
        
        
                // Working in one dimension only. We need a precise statement of the axis (axis: "both" is not enough here -
                // we need to know which one).
                if ( !( axis === norm.HORIZONTAL || axis === norm.VERTICAL ) ) throw new Error( "Axis option not defined, or not defined unambiguously, with current value " + axis );
        
                // Convert string input to number
                if ( lib.isString( position ) ) {
        
                    position = position.toLowerCase();
        
                    // Deal with +=, -= relative position prefixes
                    prefix = position.slice( 0, 2 );
                    if ( prefix === "+=" || prefix === "-=" ) {
                        position = position.slice( 2 );
                        sign = prefix === "+=" ? 1 : -1;
                        basePosition = lib.getScrollStartPosition_QW( $container, queueWrapper, axis, scrollMode );
                    }
        
                    // Resolve px, % units
                    if ( position.slice( -2 ) === "px" ) {
                        position = parseFloat( position.slice( 0, -2 ) );
                    } else if ( position.slice( -1 ) === "%" ) {
                        position = parseFloat( position.slice( 0, -1 ) ) * lib.getScrollMaximum( $container, axis ) / 100;
                    } else {
        
                        // Resolve position strings
                        if ( axis === norm.HORIZONTAL ) {
        
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
                    if ( lib.isString( position ) && $.isNumeric( position ) ) position = parseFloat( position );
        
                }
        
                if ( lib.isNumber( position ) ) {
        
                    // Calculate the absolute position. Explicit rounding is required because scrollTop/scrollLeft cuts off
                    // fractional pixels, rather than rounding them.
                    position = Math.round( basePosition + sign * position );
                    normalized[axis] = limitToScrollRange( position, $container, axis );
        
                } else if ( isUndefinedPositionValue( position ) ) {
                    // Ignore axis, unless we are in merge mode and a previous target value can be extracted from the queue.
                    normalized[axis] = scrollMode === norm.MODE_MERGE ? lib.getLastTarget_QW( queueWrapper, axis ) : norm.IGNORE_AXIS;
                } else {
                    // Invalid position value
                    throw new Error( "Invalid position argument " + origPositionArg );
                }
        
                // Single axis here, hence the other axis is not dealt with - set to "ignore axis"
                otherAxis = axis === norm.HORIZONTAL ? norm.VERTICAL : norm.HORIZONTAL;
                normalized[otherAxis] = norm.IGNORE_AXIS;
        
                return normalized;
        
            }
        
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
             * - The lockSpeedBelow option is set to a number (needed for values such as "off", or false)
             * - The properties `queue`, `ignoreUser`, `lockSpeedBelow` and `duration` are set to their default values when not
             *   specified.
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
            norm.normalizeOptions = function ( options, position ) {
        
                var hasX, hasY,
                    axisDefault = norm.defaults.axis;
        
                // Normalize the axis property names
                options = options ? normalizeAxisProperty( options ) : {};
        
                // Determine the axis default value
                if ( $.isPlainObject( position ) ) {
        
                    position = normalizeAxisProperty( position );
                    hasX = !isUndefinedPositionValue( position[norm.HORIZONTAL] ) && position[norm.HORIZONTAL] !== norm.IGNORE_AXIS;
                    hasY = !isUndefinedPositionValue( position[norm.VERTICAL] ) && position[norm.VERTICAL] !== norm.IGNORE_AXIS;
        
                    axisDefault = ( hasX && hasY ) ? norm.BOTH_AXES : hasX ? norm.HORIZONTAL : norm.VERTICAL;
        
                } else if ( lib.isString( position ) ) {
        
                    position = position.toLowerCase();
        
                    if ( position === "top" || position === "bottom" ) {
                        axisDefault = norm.VERTICAL;
                    } else if ( position === "left" || position === "right" ) {
                        axisDefault = norm.HORIZONTAL;
                    }
        
                }
        
                options.lockSpeedBelow = normalizeSpeedLockThreshold( options );
        
                validateIgnoreUserOption( options );
        
                // Apply defaults where applicable
                return $.extend( {}, norm.defaults, { axis: axisDefault, duration: $.scrollable.defaultDuration }, options );
        
            };
        
            /**
             * Accepts any of the recognized names for an axis and returns the canonical axis name.
             *
             * Throws an error if the argument is not recognized as an axis name.
             *
             * @param   {string} name
             * @returns {string}
             */
            norm.normalizeAxisName = function ( name ) {
        
                if ( lib.isInArray( name, altAxisNamesV ) ) {
                    name = norm.VERTICAL;
                } else if ( lib.isInArray( name, altAxisNamesH ) ) {
                    name = norm.HORIZONTAL;
                } else if ( lib.isInArray( name, altAxisNamesBoth ) ) {
                    name = norm.BOTH_AXES;
                }
        
                if ( !( name === norm.VERTICAL || name === norm.HORIZONTAL || name === norm.BOTH_AXES ) ) throw new Error( "Invalid axis name " + name );
        
                return name;
        
            };
        
            /**
             * Verifies that the value of the ignoreUserOption is valid, if it is set. Throws an error if the value isn't
             * recognized.
             *
             * Falsy values are ok, no matter of which type.
             *
             * @param {Object} options
             */
            function validateIgnoreUserOption ( options ) {
                var ignoreUser = options && options.ignoreUser;
                if ( ignoreUser && !( ignoreUser === true || ignoreUser === norm.IGNORE_USER_SCROLL_ONLY || ignoreUser === norm.IGNORE_USER_CLICK_TOUCH_ONLY ) ) throw new Error( 'Invalid ignoreUser option value "' + ignoreUser + '"');
            }
        
            /**
             * Returns the scroll mode after examining the animation options.
             *
             * @param   {Object} animationOptions
             * @returns {string}
             */
            norm.getScrollMode = function ( animationOptions ) {
                return animationOptions.append ? norm.MODE_APPEND : animationOptions.merge ? norm.MODE_MERGE : norm.MODE_REPLACE;
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
             * Returns the speed lock threshold as a number, in px, based on the current options and the global default settings.
             *
             * If the distance covered by the scroll animation is below the threshold, the duration is reduced to keep the speed
             * of the animation from falling further.
             *
             * Falsy and non-numeric values (e.g. lockSpeedBelow: "off") are returned as 0.
             *
             * @param   {Object} options
             * @returns {number}
             */
            function normalizeSpeedLockThreshold ( options ) {
                var threshold = options.lockSpeedBelow !== undefined ? options.lockSpeedBelow : $.scrollable.lockSpeedBelow;
        
                threshold = parseFloat( threshold );
                return isNaN( threshold ) ? 0 : threshold;
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
                    if ( lib.isInArray( key, altAxisNames ) ) {
                        normalized[norm.normalizeAxisName( key )] = value;
                    } else if ( key === "axis" ) {
                        normalized[key] = norm.normalizeAxisName( value );
                    } else {
                        normalized[key] = value;
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
        
            /**
             * Custom types.
             *
             * For easier documentation and type inference.
             */
        
            /**
             * @name Coordinates
             * @type {Object}
             *
             * @property {number} horizontal
             * @property {number} vertical
             */
        
        } )( norm, lib, queue );
        
        
        ( function ( queue, lib, norm ) {
            "use strict";
        
            /** @type {Function[]}  jQuery effects functions which have a custom queue option and take the options hash as first argument */
            var jqEffectsWithOptionsArg1 = getJQueryFunctions( [
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
        
        
            /**
             * @param {jQuery} $elem
             * @param {string} [queueName]  defaults to the internal default queue
             * @constructor
             */
            queue.QueueWrapper = function ( $elem, queueName ) {
                this._$elem = $elem;
                this._queueName = queueName !== undefined ? queueName : norm.defaults.queue;
                this._isInternalCustomQueue = isInternalCustomQueue( this._queueName );
                this._isOtherCustomQueue = isOtherCustomQueue( this._queueName );
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
             * @param {Object}        config
             * @param {Function}      config.func    the "payload" function to be executed; invoked in the context of queueWrapper.$elem
             * @param {Array}         config.args    of config.func
             * @param {AnimationInfo} [config.info]  info to be attached to the sentinel, in an `info` property
             */
            queue.QueueWrapper.prototype.addToQueue = function ( config ) {
        
                var func = config.func,
                    args = config.args,
        
                    $elem = this._$elem,
                    queueName = this._queueName,
        
                    sentinel = function ( next ) { next(); };
        
                sentinel.isSentinel = true;
                if ( config.info ) sentinel.info = config.info;
        
                if ( isQueueable( func ) ) {
                    // Dealing with an animation-related jQuery function which adds itself to the queue automatically.
                    //
                    // First, force it to use the specified queue (in case there is an inconsistency). Choose the right
                    // arguments format for the function at hand.
                    if ( lib.isInArray( func, jqEffectsWithOptionsArg1 ) ) {
                        $.extend( args[0], { queue: queueName } );
                    } else if ( lib.isInArray( func, jqEffectsWithOptionsArg2 ) ) {
                        $.extend( args[1], { queue: queueName } );
                    } else if ( lib.isInArray( func, jqEffectsWithStringArg2 ) ) {
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
                // queue progress. Sentinels also serve as a store for animation info (scroll target position, step history,
                // callback messaging).
                //
                // The sentinel must be added to any other queue as well. Sentinels are not needed for tracking progress there
                // (no auto start management for those queues), but we must have the animation info around.
                $elem.queue( queueName, sentinel );
        
                // Auto-start the internal custom queue if it is stuck.
                //
                // The telltale sign is that the new animation is still in the queue at index 0, hence its associated sentinel
                // is at index 1. That only happens if the queue is stuck. If the animation is merely waiting in line until
                // another animation finishes, it won't be waiting at index 0. That position is occupied by the sentinel of the
                // previous, ongoing animation.
                if ( this._isInternalCustomQueue && this.getContent()[1] === sentinel ) $elem.dequeue( queueName );
        
            };
        
            /**
             * Returns an array of all info objects currently held in the queue, in ascending order (newest is last).
             *
             * Info objects are attached to sentinels and hold information about the corresponding (scroll) animation.
             *
             * @returns {AnimationInfo[]}
             */
            queue.QueueWrapper.prototype.getInfo = function () {
                var info = [],
                    queueContent = this.getContent();
        
                $.each( queueContent, function ( index, entry ) {
                    if ( entry.isSentinel && entry.info ) info.push( entry.info );
                } );
        
                return info;
            };
        
            /**
             * Returns the first (oldest) info object currently held in the queue, or undefined if no such object exists.
             *
             * Info objects are attached to sentinels and hold information about the corresponding (scroll) animation.
             *
             * @returns {AnimationInfo|undefined}
             */
            queue.QueueWrapper.prototype.getFirstInfo = function () {
                var info = this.getInfo();
                return info.length ? info[0] : undefined;
            };
        
        
            /**
             * Returns the last (newest) info object currently held in the queue, or undefined if no such object exists.
             *
             * Info objects are attached to sentinels and hold information about the corresponding (scroll) animation.
             *
             * @returns {AnimationInfo|undefined}
             */
            queue.QueueWrapper.prototype.getLastInfo = function () {
                var info = this.getInfo(),
                    lastIndex = info.length - 1;
        
                return info.length ? info[lastIndex] : undefined;
            };
        
            /**
             * Returns the queue content as an array.
             *
             * @returns {Function[]}
             */
            queue.QueueWrapper.prototype.getContent = function () {
                return this._$elem.queue( this._queueName );
            };
        
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
                return lib.isInArray( func, jQueryEffects );
            }
        
            /**
             * Checks if the queue name refers to the internal queue used for scrolling, and if the internal queue is set to a
             * custom queue, not "fx".
             *
             * @param   {string} queueName
             * @returns {boolean}
             */
            function isInternalCustomQueue ( queueName ) {
                return queueName === norm.defaults.queue && queueName !== "fx";
            }
        
            /**
             * Checks if the queue name refers to a custom queue other than the internal queue used for scrolling.
             *
             * @param   {string} queueName
             * @returns {boolean}
             */
            function isOtherCustomQueue ( queueName ) {
                return lib.isString( queueName ) && queueName !== "" && queueName !== norm.defaults.queue && queueName !== "fx";
            }
        
        } )( queue, lib, norm );
        
        
        ( function ( lib, norm, queue, core ) {
            "use strict";
        
            /** @type {string[]}  names of all animation options which are exit callbacks (called when the animation terminates) */
            var animationExitCallbacks = [ "complete", "done", "fail", "always" ],
        
                /** @type {string[]}  names of all animation options which are callbacks */
                animationCallbacks = animationExitCallbacks.concat( "start", "step", "progress" );
        
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
                    // appropriate property is clientHeight/clientWidth; for a window, use $.windowHeight()/$.windowWidth() to
                    // accommodate pinch zooming, and handle minimal UI on iOS.
                    if ( axis === norm.HORIZONTAL ) {
                        containerSize = isWindow ? $.windowWidth() : container.clientWidth;
                        contentSize = isWindow ? $.documentWidth( _document ) : container.scrollWidth;
                    } else if ( axis === norm.VERTICAL ) {
                        containerSize = isWindow ? $.windowHeight() : container.clientHeight;
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
             * Expects an object of animation options and returns a new object consisting only of the callbacks. Does not modify
             * the input object.
             *
             * Returns an empty object if the animation options don't define any callbacks, or if the options are undefined.
             *
             * @param   {Object}    [animationOptions]
             * @returns {Callbacks}
             */
            lib.getCallbacks = function ( animationOptions ) {
                return pick( animationOptions, animationCallbacks );
            };
        
            /**
             * Expects an object of animation options and returns a new object consisting only of the exit callbacks (complete,
             * done, fail, always). Does not modify the input object.
             *
             * Returns an empty object if the animation options don't define any callbacks, or if the options are undefined.
             *
             * @param   {Object}    [animationOptions]
             * @returns {Callbacks}
             */
            lib.getExitCallbacks = function ( animationOptions ) {
                return pick( animationOptions, animationExitCallbacks );
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
             * Delegates to lib.addAnimation and, implicitly, to queueWrapper.addToQueue otherwise. See there for more.
             *
             * @param {jQuery}      $elem
             * @param {Coordinates} position   the normalized position
             * @param {Object}      options    normalized animation options
             */
            lib.addScrollAnimation = function ( $elem, position, options ) {
                var posX = position[ norm.HORIZONTAL ],
                    posY = position[ norm.VERTICAL ],
                    hasPosX = posX !== norm.IGNORE_AXIS,
                    hasPosY = posY !== norm.IGNORE_AXIS,
                    animated = {},
                    history = options._history || { real: [], expected: [] },
                    callbackMessageContainer = createOuterMessageContainer(),
                    animationInfo = {
                        position: position,
                        history: history,
                        callbackMessages: callbackMessageContainer
                    };
        
                options = addUserScrollDetection( options, history );
                options = addUserClickTouchDetection( $elem, options );
        
                options = addMessagingToCallbacks( options, callbackMessageContainer );
        
                if ( hasPosX ) animated.scrollLeft = posX;
                if ( hasPosY ) animated.scrollTop = posY;
        
                if ( hasPosX || hasPosY ) lib.addAnimation( $elem, animated, options, animationInfo );
            };
        
            /**
             * Sets up an animation for an element.
             *
             * Delegates to queueWrapper.addToQueue - see there for more.
             *
             * @param {jQuery}        $elem
             * @param {Object}        properties       the animated property or properties, and their target value(s)
             * @param {Object}        options          animation options
             * @param {AnimationInfo} [animationInfo]  info describing a scroll animation: the resolved, absolute target scroll
             *                                         position of the animation, the container of the step history, and the
             *                                         message container for communicating with the animation callbacks
             */
            lib.addAnimation = function ( $elem, properties, options, animationInfo ) {
                var queueWrapper = new queue.QueueWrapper( $elem, options.queue ),
                    config = {
                    func: $.fn.animate,
                    args: [ properties, options ],
                    info: animationInfo
                };
        
                queueWrapper.addToQueue( config );
            };
        
            /**
             * Stops an ongoing scroll animation and clears the queue of scroll animations. Optionally jumps to the targeted
             * position, rather than just stopping the scroll animation wherever it happens to be. Returns a history of
             * animation steps (StepHistory), or undefined if the queue is bypassed (with options.queue == false).
             *
             * Requires the actual scrollable element, as returned by $.fn.scrollable(). The options must have been normalized.
             *
             * The last argument allows you to pass messages to the `fail` callbacks of ongoing and queued animations. Pass the
             * messages as a hash, and they will show up in the messages argument received by the callbacks.
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
             * @param   {jQuery}         $scrollable
             * @param   {Object}         options
             * @param   {string|boolean} options.queue
             * @param   {boolean}        [options.jumpToTargetPosition=false]
             * @param   {Object}         [messages]
             * @returns {StepHistory|undefined}
             */
            lib.stopScrollAnimation = function ( $scrollable, options, messages ) {
                var history;
        
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
                    history = getCurrentStepHistory( $scrollable, options );
        
                    // Ongoing and queued scroll animations are about to be stopped or removed. Allow messages to be sent to
                    // their callbacks.
                    if ( messages ) lib.notifyScrollCallbacks( $scrollable, messages, animationExitCallbacks, options.queue );
        
                    $scrollable.stop( options.queue, true, options.jumpToTargetPosition );
                }
        
                return history;
            };
        
            /**
             * Transfers all properties of a message object to the message containers in the queue. Can be restricted to message
             * containers for specific types of callbacks (e.g. for `done`, `always` callbacks only).
             *
             * Affects all scroll animations which are ongoing or queued at the time of this transfer. Later on, the message
             * containers are going to be passed to the exit callbacks of these animations, as they are invoked.
             *
             * Leaves the original message object (the input object) unchanged.
             *
             * @param {jQuery}   $scrollable
             * @param {Object}   message
             * @param {string[]} [callbackNames] defaults to all exit callbacks ("complete", "done", "fail", "always")
             * @param {string}   [queueName]     usually not required, set to the scroll queue by default
             */
            lib.notifyScrollCallbacks = function ( $scrollable, message, callbackNames, queueName ) {
                var callbackMessageContainers = getMessageContainers( $scrollable, { queue: queueName }, callbackNames );
        
                if ( !$.isPlainObject( message ) ) throw new Error( 'Invalid message argument. Expected a hash but got type ' + $.type( message ) );
        
                $.each( callbackMessageContainers, function ( index, messageContainer ) {
                    $.extend( messageContainer, message );
                } );
            };
        
            /**
             * Returns the start position for a new scroll movement, for one or both axes.
             *
             * Identical to lib.getScrollStartPosition_QW, except that it does not require the queueWrapper to be set up and
             * passed in as an argument. As a consequence, a call to getStartPosition is more expensive than one to
             * lib.getScrollStartPosition_QW. Prefer lib.getScrollStartPosition_QW if you can.
             *
             * @param   {jQuery} $container
             * @param   {Object} options        must be normalized
             * @param   {string} [axis="both"]  "horizontal", "vertical", "both"
             * @returns {Coordinates|number}
             */
            lib.getScrollStartPosition = function ( $container, options, axis ) {
                var queueWrapper = new queue.QueueWrapper( core.getScrollable( $container ), options.queue ),
                    scrollMode = norm.getScrollMode( options );
        
                return lib.getScrollStartPosition_QW( $container, queueWrapper, axis, scrollMode );
            };
        
            /**
             * Returns the start position for a new scroll movement, for one or both axes.
             *
             * Usually, that is the current scroll position. In append or merge mode, the final target position of preceding
             * animations is returned, if any such animations exist (or the current position otherwise).
             *
             * The result is returned as a hash { vertical: ..., horizontal: ... } by default, or as a number if the query is
             * restricted to a single axis.
             *
             * The result is always made up of real positions, and never contains a norm.IGNORE_AXIS placeholder.
             *
             * @param   {jQuery}             $container
             * @param   {queue.QueueWrapper} queueWrapper
             * @param   {string}             axis          "horizontal", "vertical", "both"
             * @param   {string}             scrollMode    "replace", "append", "merge"
             * @returns {Coordinates|number}
             */
            lib.getScrollStartPosition_QW = function ( $container, queueWrapper, axis, scrollMode ) {
                var append = scrollMode === norm.MODE_APPEND,
                    merge = scrollMode === norm.MODE_MERGE,
                    position;
        
                axis || ( axis = norm.BOTH_AXES );
        
                // We only care about the final scroll target of preceding scrolls if we have to base a new scroll on it (append
                // mode, merge mode); otherwise, we just use the current position.
                position = ( append || merge ) ? lib.getLastTarget_QW( queueWrapper, axis ) : lib.getCurrentScrollPosition( $container, axis );
        
                // If an axis is ignored in preceding scrolls, it stays at its current position, so fill it in.
                if ( axis === norm.BOTH_AXES ) {
                    if ( position[norm.HORIZONTAL] === norm.IGNORE_AXIS ) position[norm.HORIZONTAL] = lib.getCurrentScrollPosition( $container, norm.HORIZONTAL );
                    if ( position[norm.VERTICAL] === norm.IGNORE_AXIS ) position[norm.VERTICAL] = lib.getCurrentScrollPosition( $container, norm.VERTICAL );
                } else if ( position === norm.IGNORE_AXIS ) {
                    position = lib.getCurrentScrollPosition( $container, axis );
                }
        
                return position;
            };
        
            /**
             * Returns a reference to the history of animation steps for the animation which will execute last - the last in the
             * queue, or else the currently executing one. If no animation is queued or executing, undefined is returned.
             *
             * In other words, the method fetches the last animation info entry in the queue, and returns its `history`
             * property.
             *
             * NB If the first animation is still queued and not yet executing, its associated step history is empty, of course.
             *
             * @param   {jQuery} $container  must be normalized
             * @param   {Object} options     must be normalized, therefore containing options.queue
             * @returns {StepHistory|undefined}
             */
            lib.getLastStepHistory = function ( $container, options ) {
                return lib.getLastStepHistory_QW( new queue.QueueWrapper( core.getScrollable( $container ), options.queue ) );
            };
        
            /**
             * Does the actual work of getLastStepHistory(). See there for more.
             *
             * @param   {queue.QueueWrapper} queueWrapper
             * @returns {StepHistory|undefined}
             */
            lib.getLastStepHistory_QW = function ( queueWrapper ) {
                var info = queueWrapper.getLastInfo();
                return info ? info.history : undefined;
            };
        
            /**
             * Returns the last position info which can be retrieved from the queue, for one or both axes. This is the position
             * which all preceding scroll movements eventually arrive at.
             *
             * Identical to lib.getLastTarget_QW, except that it does not require the queueWrapper to be set up and passed in as
             * an argument. As a consequence, a call to getLastTarget is more expensive than one to lib.getLastTarget_QW. Prefer
             * lib.getLastTarget_QW if you can.
             *
             * @param   {jQuery} $container
             * @param   {Object} options        must be normalized
             * @param   {string} [axis="both"]  "horizontal", "vertical", "both"
             * @returns {Coordinates|number}
             */
            lib.getLastTarget = function ( $container, options, axis ) {
                return lib.getLastTarget_QW( new queue.QueueWrapper( core.getScrollable( $container ), options.queue ), axis );
            };
        
            /**
             * Returns the last position info which can be retrieved from the queue, for one or both axes. This is the position
             * which all preceding scroll movements eventually arrive at.
             *
             * The result is returned as a hash { vertical: ..., horizontal: ... } by default, or as a number if the query is
             * restricted to a single axis.
             *
             * Values are absolute, fully resolved target positions and numeric. If there is no info for an axis (because the
             * queue is empty or animations target the other axis only), norm.IGNORE_AXIS is returned for it.
             *
             * @param   {queue.QueueWrapper} queueWrapper
             * @param   {string}             [axis="both"]  "horizontal", "vertical", "both"
             * @returns {Coordinates|number}
             */
            lib.getLastTarget_QW = function ( queueWrapper, axis ) {
                var retrievedX, retrievedY,
                    returnBothAxes = !axis || axis === norm.BOTH_AXES,
                    last = {},
                    infoEntries = queueWrapper.getInfo();
        
                // Set the default return value if there is no info for an axis
                last[norm.HORIZONTAL] = last[norm.VERTICAL] = norm.IGNORE_AXIS;
        
                // Extract the last position info for each axis which is not norm.IGNORE_AXIS
                $.each( infoEntries, function ( index, info ) {
                    if ( info.position ) {
                        retrievedX = info.position[norm.HORIZONTAL];
                        retrievedY = info.position[norm.VERTICAL];
                        if ( retrievedX !== undefined && retrievedX !== norm.IGNORE_AXIS ) last[norm.HORIZONTAL] = retrievedX;
                        if ( retrievedY !== undefined && retrievedY !== norm.IGNORE_AXIS ) last[norm.VERTICAL] = retrievedY;
                    }
                } );
        
                return returnBothAxes ? last : last[axis];
            };
        
            /**
             * Checks if a target position is redundant when compared to an existing position.
             *
             * If an axis in the target is ignored, it is considered to match any position.
             *
             * @param   {Coordinates} target     must be normalized
             * @param   {Coordinates} compareTo  must be normalized
             * @returns {boolean}
             */
            lib.isRedundantTarget = function ( target, compareTo ) {
                var newX = target[norm.HORIZONTAL],
                    newY = target[norm.VERTICAL],
                    lastX = compareTo[norm.HORIZONTAL],
                    lastY = compareTo[norm.VERTICAL],
                    matchesX = newX === norm.IGNORE_AXIS || newX === lastX,
                    matchesY = newY === norm.IGNORE_AXIS || newY === lastY;
        
                return matchesX && matchesY;
            };
        
            /**
             * Returns the current scroll position for a container on both axes, or on a specific axis if requested. The
             * container element is expected to be normalized.
             *
             * For both axes, a coordinates hash is returned, otherwise a number.
             *
             * @param   {jQuery} $container
             * @param   {string} [axis="both"]  "vertical", "horizontal", "both"
             * @returns {Coordinates|number}
             */
            lib.getCurrentScrollPosition = function ( $container, axis ) {
                var coords = {};
        
                if ( !axis || axis === norm.BOTH_AXES ) {
                    coords[norm.HORIZONTAL] = $container.scrollLeft();
                    coords[norm.VERTICAL] = $container.scrollTop();
                }
        
                return axis === norm.HORIZONTAL ? $container.scrollLeft() : axis === norm.VERTICAL ? $container.scrollTop() : coords;
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
        
            /**
             * Adds user scroll detection to the animation options, and returns the updated options hash.
             *
             * User scrolling is detected in the `step` callback. If the user has provided a step callback, it is called from
             * the wrapper `step` function which is added here.
             *
             * An independent, modified options hash is returned. The original options hash remains unchanged.
             *
             * NB Step wrapper vs propHooks:
             *
             * User scroll detection can also be placed into $.Tween.propHooks.scrollLeft and $.Tween.propHooks.scrollTop. But I
             * have abandoned that route for now.
             *
             * - It seems that a propHooks implementation is less reliable than a step wrapper, occasionally aborting scroll
             *   movements which should in fact proceed. (Maybe that could be fixed - I haven't tried hard.)
             *
             * - In addition, the propHooks are undocumented, increasing the risk that they might change or disappear in any
             *   future jQuery release. (They seem to be part of the "official" API, though, mitigating that risk.)
             *
             * On balance, a step wrapper seemed to be the better option.
             *
             * @param   {Object}      animationOptions  must be normalized
             * @param   {StepHistory} history           animation step history. Usually empty, unless a preceding animation was
             *                                          stopped as part of the call - see mgr.scrollTo()
             * @returns {Object}
             */
            function addUserScrollDetection ( animationOptions, history ) {
                var queueName = animationOptions.queue,
        
                    enableDetection = $.scrollable._enableUserScrollDetection && animationOptions.ignoreUser !== true && animationOptions.ignoreUser !== norm.IGNORE_USER_SCROLL_ONLY,
                    userScrollTriggerThreshold = animationOptions.userScrollThreshold !== undefined ? parseInt( animationOptions.userScrollThreshold, 10 ) : $.scrollable.userScrollThreshold,
                    userScrollDetectionThreshold = $.scrollable._scrollDetectionThreshold,
                    userStepCb = animationOptions.step,
        
                    modifiedOptions = animationOptions ? $.extend( {}, animationOptions ) : {},
        
                    lastExpected = {},
                    cumulativeDelta = {
                        scrollTop: 0,
                        scrollLeft: 0
                    };
        
                if ( enableDetection ) {
        
                    if ( userScrollTriggerThreshold < userScrollDetectionThreshold ) throw new Error( "User scroll detection: threshold too low. The threshold for detecting user scroll movement must be set to at least " + userScrollDetectionThreshold );
        
                    modifiedOptions.step = function ( now, tween ) {
                        var animatedProp = tween.prop,
                            otherProp = animatedProp === "scrollTop" ? "scrollLeft" : "scrollTop",
                            lastReal = {},
                            currentDelta = {
                                scrollTop: 0,
                                scrollLeft: 0
                            },
                            scrollDetected = {
                                scrollTop: false,
                                scrollLeft: false
                            };
        
                        // Get the actual last position.
                        //
                        // The step callback executes _before_ the step executes. So the scroll state information gathered here
                        // reflects the result of the preceding animation step.
                        lastReal[animatedProp] = Math.floor( tween.cur() );
                        lastReal[otherProp] = Math.floor( tween.elem[otherProp] );
        
                        if ( lastExpected[animatedProp] !== undefined && lastExpected[otherProp] !== undefined ) {
                            currentDelta[animatedProp] = lastExpected[animatedProp] - lastReal[animatedProp];
                            currentDelta[otherProp] = lastExpected[otherProp] - lastReal[otherProp];
        
                            // Only detect movements above a minimum threshold, filtering out occasional, random deviations.
                            scrollDetected[animatedProp] = Math.abs( currentDelta[animatedProp] ) > userScrollDetectionThreshold;
                            scrollDetected[otherProp] = Math.abs( currentDelta[otherProp] ) > userScrollDetectionThreshold;
        
                            if ( $.scrollable._useScrollHistoryForDetection ) {
        
                                // If there is a deviation, we compare the current position to the ones before it. If there is
                                // an exact match, it is extremely likely that the browser is lagging and has not updated the
                                // property to the current position yet. Ignore the deviation then.
                                //
                                // We do this comparison twice: once against the history of real positions, once against the
                                // history of expected positions. Tests have shown that the browser readout may catch up, but
                                // still lag on step behind in some instances.
                                //
                                // All of this is a common issue in mobile Safari (observed in iOS 8). I have not seen it happen
                                // in other browsers yet.
                                //
                                // Incidentally, it does not help to read pageXOffset, pageYOffset instead of scrollTop,
                                // scrollLeft (when dealing with a window). In mobile Safari, they suffer from the same problem.
        
                                if ( scrollDetected[animatedProp] ) scrollDetected[animatedProp] = !hasBrowserFailedToUpdate( animatedProp, lastReal, history );
                                if ( scrollDetected[otherProp] ) scrollDetected[otherProp] = !hasBrowserFailedToUpdate( otherProp, lastReal, history );
        
                            }
        
                            // If there is a valid deviation, record it.
                            if ( scrollDetected[animatedProp] || scrollDetected[otherProp] ) {
                                cumulativeDelta[animatedProp] += currentDelta[animatedProp];
                                cumulativeDelta[otherProp] += currentDelta[otherProp];
                            }
        
                            if ( Math.abs( cumulativeDelta[animatedProp] ) > userScrollTriggerThreshold || Math.abs( cumulativeDelta[otherProp] ) > userScrollTriggerThreshold ) {
                                // The real position is not where we would expect it to be. The user has scrolled.
                                //
                                // We order the scroll animation to stop immediately, but it does only come into effect _after_
                                // the current step. We want to remain at the position the user has scrolled to, so we reduce
                                // the current step to a no-op.
                                tween.now = lastReal[animatedProp];
                                lib.stopScrollAnimation( $( tween.elem ), { queue: queueName }, { cancelled: "scroll" } );
                            }
                        }
        
                        lastExpected[animatedProp] = Math.floor( tween.now );
                        lastExpected[otherProp] = lastReal[otherProp];
        
                        if ( $.scrollable._useScrollHistoryForDetection ) {
        
                            // Record expected and real values in the step history. Limit the history to the number of steps
                            // which are actually examined in hasBrowserFailedToUpdate().
                            history.real.push( lastReal );
                            history.expected.push( $.extend( {}, lastExpected ) );
        
                            if ( history.real.length > 6 ) history.real.shift();
                            if ( history.expected.length > 6 ) history.expected.shift();
        
                        }
        
                        // Finally, call the user-provided step callback
                        return userStepCb && userStepCb.apply( this, $.makeArray( arguments ) );
                    };
        
                }
        
                return modifiedOptions;
            }
        
            /**
             * Adds user click and touch detection to the animation options, and returns the updated options hash.
             *
             * An event handler for user click and touch is set up in the `start` callback, and removed in the `always`
             * callback. If the user has provided callbacks of these types, they are invoked from the wrapper callbacks which
             * are created here.
             *
             * An independent, modified options hash is returned. The original options hash remains unchanged.
             *
             * @param   {jQuery} $elem
             * @param   {Object} animationOptions  must be normalized
             * @returns {Object}
             */
            function addUserClickTouchDetection ( $elem, animationOptions ) {
                var handler,
                    events = "mousedown touchstart pointerdown",
        
                    enableDetection = $.scrollable._enableClickAndTouchDetection && animationOptions.ignoreUser !== true && animationOptions.ignoreUser !== norm.IGNORE_USER_CLICK_TOUCH_ONLY,
                    queueName = animationOptions.queue,
                    userStartCb = animationOptions.start,
                    userAlwaysCb = animationOptions.always,
                    modifiedOptions = animationOptions ? $.extend( {}, animationOptions ) : {},
        
                    // Element for attaching the event handlers: If the scrollable element is the "html" element, use the body
                    // instead.
                    $clickable = $elem[0].tagName.toLowerCase() === "html" ? $( $elem[0].ownerDocument.body ) : $elem;
        
                if ( enableDetection ) {
        
                    handler = function () {
                        lib.stopScrollAnimation( $elem, { queue: queueName }, { cancelled: "click" } );
                    };
        
                    modifiedOptions.start = function () {
                        // Add the event handler for mousedown, touchstart, pointerdown
                        $clickable.on( events, handler );
        
                        // Call the user-provided `start` callback
                        return userStartCb && userStartCb.apply( this, $.makeArray( arguments ) );
                    };
        
                    modifiedOptions.always = function () {
                        // Remove the event handlers
                        $clickable.off( events, handler );
        
                        // Call the user-provided `always` callback
                        return userAlwaysCb && userAlwaysCb.apply( this, $.makeArray( arguments ) );
                    };
        
                }
        
                return modifiedOptions;
            }
        
            /**
             * Replaces each animation exit callback (complete, done, fail, always) in the animation options with a wrapper
             * function which calls the original callback, adding a message container to the callback arguments.
             *
             * Expects the animation options and the (outer) message container as arguments. Returns the modified animation
             * options. Leaves the original options untouched.
             *
             * For callbacks which receive two arguments (done, fail, always), the message container is added as the third one.
             * The complete callback, which is called without arguments out of the box, receives the message container as the
             * only argument.
             *
             * @param   {Object} animationOptions
             * @param   {Object} outerMessageContainer
             * @returns {Object}
             */
            function addMessagingToCallbacks ( animationOptions, outerMessageContainer ) {
                var callbacks = lib.getExitCallbacks( animationOptions ),
                    modifiedOptions = animationOptions ? $.extend( {}, animationOptions ) : {};
        
                $.each( callbacks, function ( callbackName, callback ) {
                    var messageContainer = outerMessageContainer[callbackName];
        
                    modifiedOptions[callbackName] = function () {
                        var args = $.makeArray( arguments );
        
                        // Callbacks with arguments (done, fail, always) are supposed to receive two arguments, but jQuery omits
                        // the second argument, jumpedToEnd, if the jumpedToEnd flag has not been used. Add it with value
                        // undefined if necessary.
                        if ( args.length === 1 ) args.push( undefined );
        
                        // Add the message container as the third argument (or, in the case of the `complete` callback, as the
                        // first and only argument).
                        //
                        // We ensure the argument position explicitly, rather than just append the argument at the end, in case
                        // undocumented arguments get passed to the callbacks in some versions of jQuery.
                        args.splice( 2, 0, messageContainer );
        
                        // Call the original callback
                        callback.apply( this, args );
                    };
        
                } );
        
                return modifiedOptions;
            }
        
            /**
             * Helper for addUserScrollDetection(), checks the last real position against a history of real and expected
             * positions. Returns whether or not the browser has failed to update the real position in time.
             *
             * That is the case when the real position has not advanced during the animation and still equals one in history.
             * See the comment in addUserScrollDetection for more.
             *
             * @param   {string}      property
             * @param   {ScrollState} lastReal
             * @param   {StepHistory} history
             * @returns {boolean}
             */
            function hasBrowserFailedToUpdate ( property, lastReal, history ) {
                var i, steps,
                    hasFailed = false,
                    lenReal = history.real.length,
                    lenExpected = history.expected.length,
                    real = lastReal[property];
        
                // Check lastReal for up to six steps back in history
                i = lenReal - 1;
                steps = 6;
                while ( i >= 0 && lenReal - i <= steps && ! hasFailed ) {
                    hasFailed = real === history.real[i][property];
                    i--;
                }
        
                // Check lastExpected for up to six steps back in history
                i = lenExpected - 1;
                steps = 6;
                while ( i >= 0 && lenExpected - i <= steps && ! hasFailed ) {
                    hasFailed = real === history.expected[i][property];
                    i--;
                }
        
                return hasFailed;
            }
        
            /**
             * Returns a reference to the history of animation steps for the animation which is currently executing, or queued
             * up next. If no animation is executing or queued, undefined is returned.
             *
             * In other words, the method fetches the first animation info entry in the queue, and returns its `history`
             * property.
             *
             * NB If the first animation is still queued and not yet executing, its associated step history is empty, of course.
             *
             * @param   {jQuery} $scrollable  the real scrollable element
             * @param   {Object} options      must be normalized, therefore containing options.queue
             * @returns {StepHistory|undefined}
             */
            function getCurrentStepHistory ( $scrollable, options ) {
                return getCurrentStepHistory_QW( new queue.QueueWrapper( $scrollable, options.queue ) );
            }
        
            /**
             * Does the actual work of getCurrentStepHistory(). See there for more.
             *
             * @param   {queue.QueueWrapper} queueWrapper
             * @returns {StepHistory|undefined}
             */
            function getCurrentStepHistory_QW ( queueWrapper ) {
                var info = queueWrapper.getFirstInfo();
                return info ? info.history : undefined;
            }
        
            /**
             * Creates a message container, for passing messages to animation callbacks.
             *
             * It consists of an outer container, which holds the actual message containers for each exit callback (complete,
             * done, fail, always). These "real" message containers, which are just empty hashes at this point, are passed to
             * the callbacks when they are invoked.
             *
             * @returns {OuterMessageContainer}
             */
            function createOuterMessageContainer () {
                var outer = {};
        
                $.each( animationExitCallbacks, function ( index, callbackName ) {
                    outer[callbackName] = {};
                } );
        
                return outer;
            }
        
            /**
             * Returns all message containers in the queue, as an array. Can be restricted to message containers for specific
             * types of callbacks.
             *
             * If there aren't any sentinels of scroll animations in the queue, and hence no message containers, an empty array
             * is returned.
             *
             * The message containers are attached to the sentinels, as part of the info entries. Message containers are used 
             * for communicating with animation callbacks (more specifically, with the exit callbacks `complete`, `done`, `fail`,
             * `always`).
             *
             * The method returns an array of the actual message containers which are passed to the callbacks, not the outer
             * message container which keeps them separated by callback type.
             * 
             * @param   {jQuery}   $scrollable      the real scrollable element
             * @param   {Object}   options          must be normalized, therefore containing options.queue
             * @param   {string[]} [callbackNames]  defaults to all exit callbacks ("complete", "done", "fail", "always")
             * @returns {Object[]}
             */
            function getMessageContainers ( $scrollable, options, callbackNames ) {
                return getMessageContainers_QW( new queue.QueueWrapper( $scrollable, options.queue ), callbackNames );
            }
        
            /**
             * Does the actual work of getMessageContainers(). See there for more.
             *
             * @param   {queue.QueueWrapper}        queueWrapper
             * @param   {string[]} [callbackNames]  defaults to all exit callbacks ("complete", "done", "fail", "always")
             * @returns {Object[]}
             */
            function getMessageContainers_QW ( queueWrapper, callbackNames ) {
                var messageContainers = [],
                    infoEntries = queueWrapper.getInfo(),
                    outerMessageContainers = $.map( infoEntries, function ( info ) {
                        return info.callbackMessages;
                    } );
        
                callbackNames || ( callbackNames = animationExitCallbacks );
        
                $.each( callbackNames, function ( index, callbackName ) {
                    if ( !lib.isInArray( callbackName, animationExitCallbacks ) ) throw new Error( 'Invalid animation callback name. Expected the name of an exit callback ("' + animationExitCallbacks.join( '", "' ) + '"), but got "' + callbackName + '"' );
        
                    $.each( outerMessageContainers, function ( index, outerMessageContainer ) {
                        messageContainers.push( outerMessageContainer[callbackName] );
                    } );
                } );
        
                return messageContainers;
            }
        
            /**
             * Calculates the distance, in pixels, from the current scroll position to the target position.
             *
             * If an axis is ignored in the target position, make sure it is set to norm.IGNORE_AXIS.
             *
             * @param   {jQuery}      $container
             * @param   {Coordinates} targetPosition
             * @returns {number}
             */
            function getCurrentTravelDistance ( $container, targetPosition ) {
                var currentPosition = lib.getCurrentScrollPosition( $container ),
                    deltaX = targetPosition[norm.HORIZONTAL] === norm.IGNORE_AXIS ? 0 : targetPosition[norm.HORIZONTAL] - currentPosition[norm.HORIZONTAL],
                    deltaY = targetPosition[norm.VERTICAL] === norm.IGNORE_AXIS ? 0 : targetPosition[norm.VERTICAL] - currentPosition[norm.VERTICAL];
        
                return Math.sqrt( Math.pow( deltaX, 2 ) + Math.pow( deltaY, 2 ) );
            }
        
            /**
             * Expects a hash and returns a copy of it, filtered to only have values for the whitelisted keys. Also omits
             * existing, matching properties if their value is undefined. Does not modify the input object.
             *
             * Returns an empty object if the hash doesn't have any matching properties, or if the hash itself is undefined.
             *
             * Roughly replicates the functionality of _.pick() in the Underscore library.
             *
             * @param   {Object|undefined} hash
             * @param   {string[]}         keyNames
             * @returns {Object}
             */
            function pick ( hash, keyNames ) {
                var picked = {};
        
                if ( hash ) {
        
                    $.each( keyNames, function ( index, name ) {
                        var value = hash[name];
                        if ( value !== undefined ) picked[name] = value;
                    } );
        
                }
        
                return picked;
            }
        
            /**
             * Adds a jQuery.animate prefilter which applies the lockSpeedBelow setting, and adjusts the duration of a scroll
             * animation when necessary.
             *
             * For more about prefilters, see https://gist.github.com/gnarf/54829d408993526fe475#prefilters
             */
            $.Animation.prefilter( function ( elem, properties, options ) {
                var $container, distance, thresholdDistance, minSpeed, maxDuration,
                    targetPosition = {},
        
                    hasX = properties && "scrollLeft" in properties,
                    hasY = properties && "scrollTop" in properties,
                    isScrollAnimation = properties && ( hasX || hasY ) && options && options._jqScrollable;
        
                if ( isScrollAnimation && options.lockSpeedBelow ) {
        
                    $container = norm.normalizeContainer( $( elem ) );
        
                    targetPosition[norm.HORIZONTAL] = hasX ? properties.scrollLeft : norm.IGNORE_AXIS;
                    targetPosition[norm.VERTICAL] = hasY ? properties.scrollTop : norm.IGNORE_AXIS;
        
                    distance = getCurrentTravelDistance( $container, targetPosition );
                    thresholdDistance = options.lockSpeedBelow;
        
                    if ( distance < thresholdDistance ) {
                        minSpeed = thresholdDistance / options.duration;
                        maxDuration = distance / minSpeed;
                        this.duration = options.duration = Math.min( maxDuration, options.duration );
                    }
        
                }
            } );
        
        
            /**
             * Custom types.
             *
             * For easier documentation and type inference.
             */
        
            /**
             * @name Callbacks
             * @type {Object}
             *
             * @property {Function} [start]
             * @property {Function} [complete]
             * @property {Function} [done]
             * @property {Function} [fail]
             * @property {Function} [always]
             * @property {Function} [step]
             * @property {Function} [progress]
             */
        
            /**
             * @name AnimationInfo
             * @type {Object}
             *
             * @property {Coordinates}           position
             * @property {OuterMessageContainer} callbackMessages
             * @property {StepHistory}           history
             */
        
            /**
             * @name OuterMessageContainer
             * @type {Object}
             *
             * @property {Object} complete
             * @property {Object} done
             * @property {Object} fail
             * @property {Object} always
             */
        
            /**
             * @name StepHistory
             * @type {Object}
             *
             * @property {ScrollState[]} real
             * @property {ScrollState[]} expected
             */
        
            /**
             * @name ScrollState
             * @type {Object}
             *
             * @property {number|undefined} scrollTop
             * @property {number|undefined} scrollLeft
             */
        
        } )( lib, norm, queue, core );
        /**
         * Core, option A:
         *
         * The scrollable element for a window is detected with a feature test.
         */
        
        ( function ( core, lib ) {
            "use strict";
        
            /** @type {string}  caches the name of the element to use for window scrolling. Values: "body" or "html" */
            var _windowScrollable;
        
            /**
             * Returns the scrollable element, in a jQuery wrapper. The container element is expected to be normalized.
             *
             * The return value of the method is determined as follows:
             *
             * - For ordinary elements, it returns the element itself.
             *
             * - For the window, it returns either body or documentElement, depending on the browser whether or not it is in
             *   quirks mode. Document, documentElement and body are considered to mean "window", and are treated the same.
             *
             * - For an iframe element, it returns the scrollable element of the iframe content window.
             *
             * If an empty jQuery set is passed in, an empty jQuery set is returned.
             *
             * @param   {jQuery} $container
             * @returns {jQuery}
             */
             core.getScrollable = function( $container ) {
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
                lib.addScrollAnimation( $scrollable, position, options );
            };
        
            /**
             * Core internals
             */
        
            /**
             * Detects which element to use for scrolling a window (body or documentElement). Returns the element, in a jQuery
             * wrapper.
             *
             * The detection is sandboxed in an iframe created for the purpose.
             *
             * @param {Window} [currentWindow=window]  needed to detect quirks mode in a particular window, and to return the
             *                                         scrollable element in the right window context
             * @returns {jQuery}
             */
            function getWindowScrollable ( currentWindow ) {
                var iframe, element, tagName,
                    currentDocument = ( currentWindow || window ).document;
        
                // In quirks mode, we have to scroll the body, regardless of the normal browser behaviour
                if ( currentDocument.compatMode === "BackCompat" ) return $( currentDocument.body );
        
                // Use the document.scrollingElement API if available.
                //
                // This API is experimental and currently supported by Chrome 44+, Opera 33+, Safari 9+ and Edge.
                // See https://developer.mozilla.org/en-US/docs/Web/API/document/scrollingElement
                if ( ! _windowScrollable ) {
                    // Being very defensive here because the API is experimental and potentially buggy, unstable, or slow.
                    element = document.scrollingElement;
                    tagName = element && element.tagName;
        
                    if ( tagName && tagName.toLowerCase ) {
                        tagName = tagName.toLowerCase();
                        if ( tagName === "html" || tagName === "body" ) _windowScrollable = tagName;
                    }
                }
        
                if ( ! _windowScrollable ) {
                    iframe = createScrollableTestIframe();
        
                    iframe.contentWindow.scrollTo( 1, 0 );
                    _windowScrollable = iframe.contentDocument.documentElement.scrollLeft === 1 ? "html" : "body";
        
                    document.body.removeChild( iframe );
                }
        
                return _windowScrollable === "html" ? $( currentDocument.documentElement ) : $( currentDocument.body );
            }
        
            /**
             * Creates an iframe document with an HTML5 doctype and UTF-8 encoding and positions it off screen. Window size
             * is 500px x 500px. Its body is 550px wide, in preparation for a horizontal scroll test. Returns the iframe element.
             *
             * The iframe content has to overflow horizontally, not vertically, because of an iOS quirk. Iframes expand
             * vertically in iOS until the content fits inside (and as a result, we are unable to scroll vertically). But
             * iframes don't expand horizontally, so scrolling on that axis works in iOS.
             *
             * @returns {HTMLIFrameElement}
             */
            function createScrollableTestIframe () {
                var iframe = document.createElement( "iframe" ),
                    body = document.body;
        
                iframe.style.cssText = "position: absolute; top: -600px; left: -600px; width: 500px; height: 500px; margin: 0px; padding: 0px; border: none; display: block;";
                iframe.frameborder = "0";
        
                body.appendChild( iframe );
                iframe.src = 'about:blank';
        
                iframe.contentDocument.write( '<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title><style type="text/css">body { width: 550px; height: 1px; }</style></head><body></body></html>' );
        
                return iframe;
            }
        
            // Let's prime getWindowScrollable() immediately after the DOM is ready. It is best to do it up front because the
            // test touches the DOM, so let's get it over with before people set up handlers for mutation events and such.
            $( function () {
                if ( _windowScrollable === undefined ) getWindowScrollable();
            } );
        
        } )( core, lib );
        
        
        
        
    
    }(
        typeof jQuery !== "undefined" ? jQuery : $
    ));

} ));

