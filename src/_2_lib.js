( function ( lib ) {
    "use strict";

    /** @type {string[]}  names of all animation options which are callbacks */
    var animationCallbacks = [ "start", "complete", "done", "fail", "always", "step", "progress" ];

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
     * Makes sure the position is within the range which can be scrolled to. The container element is expected to be
     * normalized.
     *
     * @param   {number} position
     * @param   {jQuery} $container
     * @returns {number}
     */
    lib.limitToScrollRange = function ( position, $container ) {

        var container = $container[0],
            _document = container.ownerDocument || container.document,
            isWindow = $.isWindow( container ),

        // NB We are measuring the true inner height of the container, excluding a horizontal scroll bar.
            containerHeight = isWindow ? _document.documentElement.clientHeight : container.clientHeight,
            contentHeight = isWindow ? $.documentHeight( _document ) : container.scrollHeight;

        // Make sure that the calculated value is within bounds, and can be scrolled to smoothly.
        // (documentElement.clientHeight returns the height of the window without scroll bars.)
        position = Math.min( position, contentHeight - containerHeight );
        position = Math.max( position, 0 );

        return position;

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

    function isString ( value ) {
        return typeof value === 'string' || value instanceof String;
    }

} )( lib );