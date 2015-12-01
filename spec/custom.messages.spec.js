/*global describe, it */
(function () {
    "use strict";

    describe( 'Custom messages to animation exit callbacks.', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {number} */
            maxScrollWidth, maxScrollHeight,

            /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
            callbacks_1, callbacks_2, callbacks_3, callbacks_4,

            /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
            callbackCalls_1, callbackCalls_2, callbackCalls_3, callbackCalls_4,

            /** @type {Object} custom message hash for the tests */
            message;

        beforeEach( function ( done ) {
            var fixtureCss = [
                "body { width: 3000px; height: 3000px; }",
                "html, body { margin: 0; padding: 0; border: none; }"
            ];

            f = Setup.create( "window", f, { createEl: false, injectCss: fixtureCss } );

            $window = $( window );

            afterScreenUpdate( function () {

                maxScrollWidth = 3000 - $.windowWidth();
                maxScrollHeight = 3000 - $.windowHeight();

                $window.scrollTop( 0 ).scrollLeft( 0 );

                // Reduce the default duration for animations in order to speed up the tests
                reduceDefaultDurationForAnimations();

                // Set a very low threshold for $.scrollable.lockSpeedBelow to keep the speed lock from kicking in. See
                // setLowMinimumSpeed() for more.
                //
                // ATTN To make it work, scroll movements during tests must be larger than 20px (by a fair margin,
                // ideally).
                setLowMinimumSpeed();

                // Create observed callbacks
                callbackCalls_1 = {};
                callbackCalls_2 = {};
                callbackCalls_3 = {};
                callbackCalls_4 = {};
                callbacks_1 = createObservedCallbacks( callbackCalls_1, $window );
                callbacks_2 = createObservedCallbacks( callbackCalls_2, $window );
                callbacks_3 = createObservedCallbacks( callbackCalls_3, $window );
                callbacks_4 = createObservedCallbacks( callbackCalls_4, $window );

                // Give browsers some breathing space to complete the initial setup phase.
                _.delay( done, 50 );

            } );

            message = { custom: "value" };
        } );

        afterEach( function () {
            f.cleanDom();
            restoreDefaultDurationForAnimations();
            restoreMinimumSpeed();
        } );

        afterAll( function () {
            $window.scrollTop( 0 ).scrollLeft( 0 );
            f.shutdown();
        } );


        describe( 'stopScroll: Sending a message with notifyCancelled.', function () {

            describe( 'Basics. The message', function () {

                beforeEach( function ( done ) {
                    $window.scrollTo( "bottom", callbacks_1 );

                    inMidScroll( function () {
                        $window.stopScroll( { notifyCancelled: message } );
                    } );

                    afterScroll( done );
                } );

                it( 'is passed to the fail callback', function () {
                    expect( callbackCalls_1.fail.args[2] ).toEqual( message );
                } );

                it( 'is passed to the always callback', function () {
                    expect( callbackCalls_1.always.args[2] ).toEqual( message );
                } );

                it( 'does not appear in the fail and always callbacks of an animation which is started next', function ( done ) {
                    // Implies that the following animation is also stopped prematurely somehow.
                    $window.scrollTo( "top", callbacks_2 );

                    inMidScroll( function () {
                        $window.stopScroll();
                    } );

                    afterScroll( function () {
                        expect( callbackCalls_2.fail.args[2] ).toEqual( {} );
                        expect( callbackCalls_2.always.args[2] ).toEqual( {} );
                        done();
                    } );
                } );

            } );

            describe( 'Interaction with other messages. The current stopScroll message', function () {

                beforeEach( function () {
                    $window.scrollTo( "bottom", callbacks_1 );
                } );

                it( 'is merged with a previous message, sent with notifyScrollCallbacks()', function ( done ) {
                    $window.notifyScrollCallbacks( { first: "1" } );

                    inMidScroll( function () {
                        $window.stopScroll( { notifyCancelled: { second: "2" } } );
                    } );

                    afterScroll( function () {
                        var expected = {
                            first: "1",
                            second: "2"
                        };
                        expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                        expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                        done();
                    } );
                } );

                it( 'takes precedence over an identical property in a previous notifyScrollCallbacks() message, overwriting it', function ( done ) {
                    $window.notifyScrollCallbacks( { first: "1", collision: "original" } );

                    inMidScroll( function () {
                        $window.stopScroll( { notifyCancelled: { second: "2", collision: "overwritten" } } );
                    } );

                    afterScroll( function () {
                        var expected = {
                            first: "1",
                            second: "2",
                            collision: "overwritten"
                        };
                        expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                        expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                        done();
                    } );
                } );
                
            } );

        } );

        describe( 'scrollTo: Sending a message with notifyCancelled.', function () {

            describe( 'Replace mode.', function () {

                describe( 'Basics.', function () {

                    describe( 'The animation being replaced', function () {

                        beforeEach( function ( done ) {
                            $window.scrollTo( "bottom", callbacks_1 );

                            inMidScroll( function () {
                                $window.scrollTo( "top", { notifyCancelled: message } );
                            } );

                            afterScrolls( 2, done );
                        } );

                        it( 'receives the message in its fail callback, merged with the cancelled: "replace" message', function () {
                            var expected = $.extend( message, { cancelled: "replace" } );
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                        } );

                        it( 'receives the message in its always callback, merged with the cancelled: "replace" message', function () {
                            var expected = $.extend( message, { cancelled: "replace" } );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );
                        } );

                    } );

                    describe( 'The current animation', function () {

                        beforeEach( function () {
                            $window.scrollTo( "bottom" );
                        } );

                        it( 'does not receive the message in its complete, done, always callbacks', function ( done ) {
                            inMidScroll( function () {
                                $window.scrollTo( "top", $.extend( { notifyCancelled: message }, callbacks_1 ) );
                            } );

                            afterScrolls( 2, function () {
                                expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                                expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                                expect( callbackCalls_1.always.args[2] ).toEqual( {} );

                                done();
                            } );
                        } );

                        it( 'does not receive the message in its fail callback if the current animation is stopped', function ( done ) {
                            inMidScroll( function () {
                                $window.scrollTo( "top", $.extend( { notifyCancelled: message }, callbacks_1 ) );
                                $window.stopScroll();
                            } );

                            afterScrolls( 2, function () {
                                expect( callbackCalls_1.fail.args[2] ).toEqual( {} );
                                done();
                            } );
                        } );

                    } );

                } );

                describe( 'Interaction with other messages. The notifyCancelled message', function () {

                    beforeEach( function () {
                        $window.scrollTo( "bottom", callbacks_1 );
                    } );

                    it( 'cannot overwrite the cancelled: "replace" message', function ( done ) {
                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { cancelled: "foo" } } );
                        } );

                        afterScrolls( 2, function () {
                            expect( callbackCalls_1.fail.args[2] ).toEqual( { cancelled: "replace" } );
                            expect( callbackCalls_1.always.args[2] ).toEqual( { cancelled: "replace" } );

                            done();
                        } );
                    } );

                    it( 'is merged with a previous message to the replaced animation, sent with notifyScrollCallbacks()', function ( done ) {
                        $window.notifyScrollCallbacks( { first: "1" } );

                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { second: "2" } } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = {
                                first: "1",
                                second: "2",
                                cancelled: "replace"
                            };
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                    it( 'takes precedence over an identical property in a previous notifyScrollCallbacks() message, overwriting it', function ( done ) {
                        $window.notifyScrollCallbacks( { conflict: "1" } );

                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { conflict: "2" } } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = {
                                conflict: "2",
                                cancelled: "replace"
                            };
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                } );

            } );

            describe( 'Merge mode.', function () {

                describe( 'Basics.', function () {

                    describe( 'The animation being replaced', function () {

                        beforeEach( function ( done ) {
                            $window.scrollTo( "bottom", callbacks_1 );

                            inMidScroll( function () {
                                $window.scrollTo( "top", { notifyCancelled: message, merge: true } );
                            } );

                            afterScrolls( 2, done );
                        } );

                        it( 'receives the message in its fail callback, merged with the cancelled: "merge" message', function () {
                            var expected = $.extend( message, { cancelled: "merge" } );
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                        } );

                        it( 'receives the message in its always callback, merged with the cancelled: "merge" message', function () {
                            var expected = $.extend( message, { cancelled: "merge" } );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );
                        } );

                    } );

                    describe( 'The current animation', function () {

                        beforeEach( function () {
                            $window.scrollTo( "bottom" );
                        } );

                        it( 'does not receive the message in its complete, done, always callbacks', function ( done ) {
                            inMidScroll( function () {
                                $window.scrollTo( "top", $.extend( { notifyCancelled: message, merge: true }, callbacks_1 ) );
                            } );

                            afterScrolls( 2, function () {
                                expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                                expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                                expect( callbackCalls_1.always.args[2] ).toEqual( {} );

                                done();
                            } );
                        } );

                        it( 'does not receive the message in its fail callback if the current animation is stopped', function ( done ) {
                            inMidScroll( function () {
                                $window.scrollTo( "top", $.extend( { notifyCancelled: message, merge: true }, callbacks_1 ) );
                                $window.stopScroll();
                            } );

                            afterScrolls( 2, function () {
                                expect( callbackCalls_1.fail.args[2] ).toEqual( {} );
                                done();
                            } );
                        } );

                    } );

                } );

                describe( 'The scrollTo call is a no-op, targets the same position as preceding calls. The message', function () {

                    //  Preceding calls continue because the new call is a noop

                    beforeEach( function ( done ) {
                        $window
                            .scrollTo( "bottom", callbacks_1 )
                            .scrollTo( "top", $.extend( { append: true }, callbacks_2 ) );

                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: message, merge: true } );
                        } );

                        afterScrolls( 2, done );
                    } );

                    it( 'is not passed to any of the callbacks of a preceding, ongoing animation', function () {
                        expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                        expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                        expect( callbackCalls_1.always.args[2] ).toEqual( {} );
                    } );

                    it( 'is not passed to any of the callbacks of a preceding, queued animation', function () {
                        expect( callbackCalls_2.complete.args[0] ).toEqual( {} );
                        expect( callbackCalls_2.done.args[2] ).toEqual( {} );
                        expect( callbackCalls_2.always.args[2] ).toEqual( {} );
                    } );

                } );

                describe( 'Interaction with other messages. The notifyCancelled message', function () {

                    beforeEach( function () {
                        $window.scrollTo( "bottom", callbacks_1 );
                    } );

                    it( 'cannot overwrite the cancelled: "merge" message', function ( done ) {
                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { cancelled: "foo" }, merge: true } );
                        } );

                        afterScrolls( 2, function () {
                            expect( callbackCalls_1.fail.args[2] ).toEqual( { cancelled: "merge" } );
                            expect( callbackCalls_1.always.args[2] ).toEqual( { cancelled: "merge" } );

                            done();
                        } );
                    } );

                    it( 'is merged with a previous message to the replaced animation, sent with notifyScrollCallbacks()', function ( done ) {
                        $window.notifyScrollCallbacks( { first: "1" } );

                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { second: "2" }, merge: true } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = {
                                first: "1",
                                second: "2",
                                cancelled: "merge"
                            };
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                    it( 'takes precedence over an identical property in a previous  notifyScrollCallbacks() message, overwriting it', function ( done ) {
                        $window.notifyScrollCallbacks( { conflict: "1" } );

                        inMidScroll( function () {
                            $window.scrollTo( "top", { notifyCancelled: { conflict: "2" }, merge: true } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = {
                                conflict: "2",
                                cancelled: "merge"
                            };
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                } );

            } );

            describe( 'Append mode', function () {

                describe( 'Preceding animations, completed successfully. The message', function () {

                    beforeEach( function ( done ) {
                        $window
                            .scrollTo( "bottom", callbacks_1 )
                            .scrollTo( "top", $.extend( { append: true }, callbacks_2 ) )
                            .scrollTo( "bottom", { notifyCancelled: message, append: true } );

                        afterScrolls( 3, done );
                    } );

                    it( 'is not passed to the complete, done, always callbacks of a previous, ongoing animation', function () {
                        expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                        expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                        expect( callbackCalls_1.always.args[2] ).toEqual( {} );
                    } );

                    it( 'is not passed to the complete, done, always callbacks of a previous, queued animation once it has executed', function () {
                        expect( callbackCalls_2.complete.args[0] ).toEqual( {} );
                        expect( callbackCalls_2.done.args[2] ).toEqual( {} );
                        expect( callbackCalls_2.always.args[2] ).toEqual( {} );
                    } );

                } );

                describe( 'Preceding animations, stopped before completing. The message', function () {

                    // Preceding animations are stopped with stopScroll, but it might just as well be a user click or
                    // user scroll.

                    beforeEach( function () {
                        $window
                            .scrollTo( "bottom", callbacks_1 )
                            .scrollTo( "top", $.extend( { append: true }, callbacks_2 ) )
                            .scrollTo( "bottom", { notifyCancelled: message, append: true } );
                    } );

                    it( 'is not passed to the fail callback of a previous, ongoing animation if it is stopped', function ( done ) {
                        inMidScroll( function () {
                            $window.stopScroll();
                        } );

                        afterScroll( function () {
                            expect( callbackCalls_1.fail.args[2] ).toEqual( {} );
                            done();
                        } );
                    } );

                    it( 'is not passed to the fail callback of a previous, queued animation if it is stopped while it executes', function ( done ) {
                        afterScroll( function () {
                            inMidScroll( function () {
                                $window.stopScroll();
                            } );
                        } );

                        afterScrolls( 2, function () {
                            expect( callbackCalls_2.fail.args[2] ).toEqual( {} );
                            done();
                        } );
                    } );

                } );

                it( 'The current animation', function () {

                    beforeEach( function () {
                        $window
                            .scrollTo( "bottom" )
                            .scrollTo( "top", $.extend( { notifyCancelled: message, append: true }, callbacks_1 ) );
                    } );

                    it( 'does not receive the message in its complete, done, always callbacks', function ( done ) {
                        afterScrolls( 2, function () {
                            expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                            expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                            expect( callbackCalls_1.always.args[2] ).toEqual( {} );

                            done();
                        } );
                    } );

                    it( 'does not receive the message in its fail callback if the current animation is stopped', function ( done ) {
                        afterScroll( function () {
                            inMidScroll( function () {
                                $window.stopScroll();
                            } );
                        } );

                        afterScrolls( 2, function () {
                            expect( callbackCalls_1.fail.args[2] ).toEqual( {} );
                            done();
                        } );
                    } );

                } );

            } );

        } );

        describe( 'Sending a message with notifyScrollCallbacks().', function () {

            describe( 'Basics.', function () {

                // Tests without specifying callback names.

                describe( 'Preceding animations, completed successfully. The message', function () {

                    beforeEach( function ( done ) {
                        $window
                            .scrollTo( "bottom", callbacks_1 )
                            .scrollTo( "top", $.extend( { append: true }, callbacks_2 ) );

                        inMidScroll( function () {
                            $window.notifyScrollCallbacks( message );
                        } );

                        afterScrolls( 2, done );
                    } );

                    it( 'is passed to the complete, done, always callbacks of an ongoing animation', function () {
                        expect( callbackCalls_1.complete.args[0] ).toEqual( message );
                        expect( callbackCalls_1.done.args[2] ).toEqual( message );
                        expect( callbackCalls_1.always.args[2] ).toEqual( message );
                    } );

                    it( 'is passed to the complete, done, always callbacks of a queued animation, once it has executed', function () {
                        expect( callbackCalls_2.complete.args[0] ).toEqual( message );
                        expect( callbackCalls_2.done.args[2] ).toEqual( message );
                        expect( callbackCalls_2.always.args[2] ).toEqual( message );
                    } );

                } );

                describe( 'Preceding animations, stopped before completion. The message', function () {

                    // The new message is merged with the `cancelled` message.

                    beforeEach( function () {
                        $window
                            .scrollTo( "bottom", callbacks_1 )
                            .scrollTo( "top", $.extend( { append: true }, callbacks_2 ) )
                            .notifyScrollCallbacks( message );
                    } );

                    it( 'is passed to the fail, always callbacks of an ongoing animation which is replaced later, in "replace" mode', function ( done ) {
                        inMidScroll( function () {
                            $window.scrollTo( 100 );
                        } );

                        afterScrolls( 2, function () {
                            var expected = $.extend( message, { cancelled: "replace" } );
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );
                            done();
                        } );
                    } );

                    it( 'is passed to the fail, always callbacks of an ongoing animation which is replaced later, in "merge" mode', function ( done ) {
                        inMidScroll( function () {
                            $window.scrollTo( 100, { merge: true } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = $.extend( message, { cancelled: "merge" } );
                            expect( callbackCalls_1.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );
                            done();
                        } );
                    } );

                    it( 'is passed to the fail, always callbacks of a queued animation which later, while executing, is replaced in "replace" mode', function ( done ) {
                        afterScroll( function () {
                            inMidScroll( function () {
                                $window.scrollTo( 100 );
                            } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = $.extend( message, { cancelled: "replace" } );
                            expect( callbackCalls_2.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_2.always.args[2] ).toEqual( expected );
                            done();
                        } );
                    } );

                    it( 'is passed to the fail, always callbacks of a queued animation which later, while executing, is replaced in "merge" mode', function ( done ) {
                        afterScroll( function () {
                            inMidScroll( function () {
                                $window.scrollTo( 100, { merge: true } );
                            } );
                        } );

                        afterScrolls( 2, function () {
                            var expected = $.extend( message, { cancelled: "merge" } );
                            expect( callbackCalls_2.fail.args[2] ).toEqual( expected );
                            expect( callbackCalls_2.always.args[2] ).toEqual( expected );
                            done();
                        } );
                    } );

                } );

                describe( 'Animations created after the call. The message', function () {

                    beforeEach( function () {
                        $window
                            .scrollTo( "bottom" )
                            .notifyScrollCallbacks( message );
                    } );

                    it( 'is not passed to an animation which is initiated and running after the notifyScrollCallbacks() call', function ( done ) {
                        $window.scrollTo( 100, callbacks_1 );

                        afterScroll( function () {
                            expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                            expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                            expect( callbackCalls_1.always.args[2] ).toEqual( {} );

                            done();
                        } );
                    } );

                    it( 'is not passed to an animation which is added to the end of an existing queue after the notifyScrollCallbacks() call', function ( done ) {
                        $window.scrollTo( 100, $.extend( { append: true } , callbacks_1 ) );

                        afterScrolls( 2, function () {
                            expect( callbackCalls_1.complete.args[0] ).toEqual( {} );
                            expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                            expect( callbackCalls_1.always.args[2] ).toEqual( {} );

                            done();
                        } );
                    } );

                } );

                describe( 'Interaction with other messages. The current message', function () {

                    beforeEach( function () {
                        $window.scrollTo( "bottom", callbacks_1 );
                    } );

                    it( 'is merged with a previous message to the same callbacks, sent with notifyScrollCallbacks()', function ( done ) {
                        $window.notifyScrollCallbacks( { first: "1" } );

                        inMidScroll( function () {
                            $window.notifyScrollCallbacks( { second: "2" } );
                        } );

                        afterScroll( function () {
                            var expected = {
                                first: "1",
                                second: "2"
                            };

                            expect( callbackCalls_1.complete.args[0] ).toEqual( expected );
                            expect( callbackCalls_1.done.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                    it( 'overwrites an identical property in a previous message, sent with notifyScrollCallbacks()', function ( done ) {
                        $window.notifyScrollCallbacks( { conflict: "1" } );

                        inMidScroll( function () {
                            $window.notifyScrollCallbacks( { conflict: "2" } );
                        } );

                        afterScroll( function () {
                            var expected = {
                                conflict: "2"
                            };

                            expect( callbackCalls_1.complete.args[0] ).toEqual( expected );
                            expect( callbackCalls_1.done.args[2] ).toEqual( expected );
                            expect( callbackCalls_1.always.args[2] ).toEqual( expected );

                            done();
                        } );
                    } );

                } );

            } );

            describe( 'Callback names.', function () {

                beforeEach( function () {
                    $window.scrollTo( "bottom", callbacks_1 );
                } );

                describe( 'When specifying a single callback name as a string,', function () {

                    // Using "complete".

                    beforeEach( function ( done ) {
                        $window.notifyScrollCallbacks( message, "complete" );
                        afterScroll( done );
                    } );

                    it( 'the message is passed to the callback of that name', function () {
                        expect( callbackCalls_1.complete.args[0] ).toEqual( message );
                    } );

                    it( 'the message is not passed to the other callbacks', function () {
                        expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                        expect( callbackCalls_1.always.args[2] ).toEqual( {} );
                    } );

                } );

                describe( 'When specifying an array of callback names,', function () {

                    // Using ["complete", "always"]

                    beforeEach( function ( done ) {
                        $window.notifyScrollCallbacks( message, ["complete", "always"] );
                        afterScroll( done );
                    } );

                    it( 'the message is passed to the callbacks named in the array', function () {
                        expect( callbackCalls_1.complete.args[0] ).toEqual( message );
                        expect( callbackCalls_1.always.args[2] ).toEqual( message );
                    } );

                    it( 'the message is not passed to the other callbacks', function () {
                        expect( callbackCalls_1.done.args[2] ).toEqual( {} );
                    } );

                } );

                describe( 'Specifying an invalid callback name. The call throws an error', function () {
                    var errorMessage;

                    beforeEach( function () {
                        errorMessage = /^Invalid animation callback name/;
                    } );

                    it( 'with the name being passed as a string', function ( done ) {
                        // Testing all existing, but invalid callback names: "start", "step", "progress".
                        expect( function () { $window.notifyScrollCallbacks( message, "start" ); } ).toThrowError( errorMessage );
                        expect( function () { $window.notifyScrollCallbacks( message, "step" ); } ).toThrowError( errorMessage );
                        expect( function () { $window.notifyScrollCallbacks( message, "progress" ); } ).toThrowError( errorMessage );

                        afterScroll( done );
                    } );

                    it( 'with the name being passed as part of an array', function ( done ) {
                        // Testing all existing, but invalid callback names, one by one: "start", "step", "progress".
                        expect( function () { $window.notifyScrollCallbacks( message, ["complete", "start", "fail"] ); } ).toThrowError( errorMessage );
                        expect( function () { $window.notifyScrollCallbacks( message, ["complete", "step", "fail"] ); } ).toThrowError( errorMessage );
                        expect( function () { $window.notifyScrollCallbacks( message, ["complete", "progress", "fail"] ); } ).toThrowError( errorMessage );

                        afterScroll( done );
                    } );
                    
                } );


            } );

            describe( 'Calling notifyScrollCallbacks() without an animation in progress or pending.', function () {

                it( 'The call does not throw an error', function () {
                    expect( function () { $window.notifyScrollCallbacks( message ); } ).not.toThrow();
                } );

            } );

        } );

    } );

})();