// jQuery.scrollable, v0.3.1
// Copyright (c)2015 Michael Heim, Zeilenwechsel.de
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
                    // todo enforce final jump as a safety measure (by creating a new, aggregate done callback) - see Pagination.Views
        
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
        
            /** @type {Object}  default scroll options */
            norm.defaults = {
                axis: norm.VERTICAL,
                queue: "internal.jquery.scrollable"
            };
        
            /** @type {string}  "replace" mode flag for chained scrollTo calls */
            norm.MODE_REPLACE = "replace";
        
            /** @type {string}  "append" mode flag for chained scrollTo calls */
            norm.MODE_APPEND = "append";
        
            /** @type {string}  "merge" mode flag for chained scrollTo calls */
            norm.MODE_MERGE = "merge";
        
        
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
        
                // Apply defaults where applicable
                return $.extend( {}, norm.defaults, { axis: axisDefault }, options );
        
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
             * @param {Object}   config
             * @param {Function} config.func          the "payload" function to be executed; invoked in the context of config.$elem
             * @param {Array}    config.args          of config.func
             * @param {Object}   [config.info]        info to be attached to the sentinel, in an `info` property
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
                // queue progress. Sentinels also serve as a store for animation info (scroll target position, callbacks).
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
             * @returns {Object[]}
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
             * @param   {Object|undefined} [animationOptions]
             * @returns {Callbacks}
             */
            lib.extractCallbacks = function ( animationOptions ) {
                var callbacks = {};
        
                if ( animationOptions ) {
        
                    $.each( animationCallbacks, function ( index, name ) {
                        var callback = animationOptions[name];
                        if ( callback ) {
                            callbacks[name] = callback;
                            delete animationOptions[name];
                        }
                    } );
        
                }
        
                return callbacks;
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
                var callbacks = {};
        
                if ( animationOptions ) {
        
                    $.each( animationCallbacks, function ( index, name ) {
                        var callback = animationOptions[name];
                        if ( callback ) callbacks[name] = callback;
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
             * Delegates to lib.addAnimation and, implicitly, to queueWrapper.addToQueue otherwise. See there for more.
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
                    animated = {},
                    animationInfo = {
                        position: position,
                        callbacks: lib.getCallbacks( options )
                    };
        
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
             * @param {Object}        [options]        animation options
             * @param {AnimationInfo} [animationInfo]  info describing a scroll animation: the resolved, absolute target scroll
             *                                         position of the animation, and the animation callbacks
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
                } else if ( position[axis] === norm.IGNORE_AXIS ) {
                    position[axis] = lib.getCurrentScrollPosition( $container, axis );
                }
        
                return position;
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
             * @property {Coordinates} position
             * @property {Callbacks}   callbacks
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
                var iframe,
                    currentDocument = ( currentWindow || window ).document;
        
                // In quirks mode, we have to scroll the body, regardless of the normal browser behaviour
                if ( currentDocument.compatMode === "BackCompat" ) return $( currentDocument.body );
        
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

