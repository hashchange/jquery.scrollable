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
    queue.addToQueue = function ( config ) {

        var $elem = config.$elem,
            func = config.func,
            args = config.args,

            queueName = config.queue !== undefined ? config.queue : "fx",
            isInternalCustomQueue = queueName === norm.defaults.queue && queueName !== "fx",

            sentinel = function ( next ) { next(); };

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
    queue.runNextInQueue = function ( config ) {

        var insertAt, isNext, queueContent, moveThis,
            $elem = config.$elem,
            queueName = config.queue !== undefined ? config.queue : "fx",

            isFxQueue = queueName === "fx",
            isInternalCustomQueue = queueName === norm.defaults.queue && !isFxQueue,
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
        // - The internal, managed queue never gets stuck, though. All additions are run through queue.addToQueue, which
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
        queue.addToQueue( config );

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

} )( queue, lib, norm );

