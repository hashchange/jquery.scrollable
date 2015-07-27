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
     * @param {Function}      config.func    the "payload" function to be executed; invoked in the context of config.$elem
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

