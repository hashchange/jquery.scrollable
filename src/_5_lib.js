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
            if ( !$.inArray( callbackName, animationExitCallbacks ) ) throw new Error( 'Invalid animation callback name. Expected the name of an exit callback ("' + animationExitCallbacks.join( '", "' ) + '"), but got "' + callbackName + '"' );

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