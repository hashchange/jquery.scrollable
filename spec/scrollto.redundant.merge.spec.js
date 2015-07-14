/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Redundant calls, in "merge" mode', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
            callbacks,

            /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
            callbackCalls;

        beforeEach( function ( done ) {
            var fixtureCss = [
                "body { width: 3000px; height: 3000px; }",
                "html, body { margin: 0; padding: 0; border: none; }"
            ];

            f = Setup.create( "window", f, { createEl: false, injectCss: fixtureCss } );

            $window = $( window );

            $window.scrollTop( 0 ).scrollLeft( 0 );

            // Reduce the default duration for animations in order to speed up the tests
            reduceDefaultDurationForAnimations();

            // Create observed callbacks
            callbackCalls = {};
            callbacks = createObservedCallbacks( callbackCalls, $window );

            // Give browsers some breathing space to complete the initial setup phase.
            _.delay( done, 50 );
        } );

        afterEach( function () {
            f.cleanDom();
            restoreDefaultDurationForAnimations();
        } );

        afterAll( function () {
            f.shutdown();
        } );

        describe( 'At rest, without ongoing scroll movements. Current and target locations are identical.', function () {

            var initialX, initialY;

            beforeEach( function () {
                initialX = initialY = 50;
                $window.scrollTop( initialY ).scrollLeft( initialX );
            } );

            describe( 'Movement. The animation is skipped', function () {

                // Test method:
                //
                // We test this by appending another animation. It should start immediately. When the time needed for a
                // single scroll animation has passed, the target of the appended animation must already have been
                // reached.

                it( 'for a horizontal movement', function ( done ) {
                    $window
                        .scrollTo( { x: initialX }, { merge: true } )
                        .scrollTo( { x: initialX + 100 }, { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( initialY );
                        expect( $window.scrollLeft() ).toEqual( initialX + 100 );
                        done();
                    } );
                } );

                it( 'for a vertical movement', function ( done ) {
                    $window
                        .scrollTo( { y: initialY }, { merge: true } )
                        .scrollTo( { y: initialY + 100 }, { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( initialY + 100 );
                        expect( $window.scrollLeft() ).toEqual( initialX );
                        done();
                    } );
                } );

                it( 'for a movement on both axes', function ( done ) {
                    $window
                        .scrollTo( { x: initialX, y: initialY }, { merge: true } )
                        .scrollTo( { x: initialX + 100, y: initialY + 100 }, { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( initialY + 100 );
                        expect( $window.scrollLeft() ).toEqual( initialX + 100 );
                        done();
                    } );
                } );

            } );

            describe( 'Callbacks', function () {

                beforeEach( function ( done ) {
                    $window.scrollTop( 50 ).scrollLeft( 50 );
                    $window.scrollTo( 50, $.extend( { merge: true }, callbacks ) );
                    afterScroll( done );
                } );

                it( 'the "start" callback has not fired', function () {
                    expect( callbacks.start ).not.toHaveBeenCalled();
                } );

                it( 'the "step" callback has not fired', function () {
                    expect( callbacks.step ).not.toHaveBeenCalled();
                } );

                it( 'the "progress" callback has not fired', function () {
                    expect( callbacks.progress ).not.toHaveBeenCalled();
                } );

                it( 'the "done" callback has not fired', function () {
                    expect( callbacks.done ).not.toHaveBeenCalled();
                } );

                it( 'the "complete" callback has not fired', function () {
                    expect( callbacks.complete ).not.toHaveBeenCalled();
                } );

                it( 'the "fail" callback has not fired', function () {
                    expect( callbacks.fail ).not.toHaveBeenCalled();
                } );

                it( 'the "always" callback has not fired', function () {
                    expect( callbacks.always ).not.toHaveBeenCalled();
                } );

            } );

        } );

        describe( 'A scroll movement is in progress. Its target location and the target of the new call are the same.', function () {

            it( 'The new scrollTo animation is skipped', function ( done ) {
                // First scroll movement.
                $window.scrollTo( 100 );

                inMidScroll( function () {
                    // Call #2 with identical target, must be ignored.
                    $window.scrollTo( 100, { merge: true } );

                    // As in the first group of tests, we check that the animation is skipped by appending yet another
                    // animation (#3), with a different target. That move is added to the queue. Because it starts
                    // immediately after animation #1 has finished, its target must be reached after a total of two
                    // scroll periods.
                    $window.scrollTo( 200, { append: true } );
                } );

                afterScrolls( 2, function () {
                    expect( $window.scrollTop() ).toEqual( 200 );
                    done();
                } );
            } );

            it( 'Callbacks of the new scrollTo call do not fire', function ( done ) {
                // First scroll movement.
                $window.scrollTo( 100 );

                inMidScroll( function () {
                    $window.scrollTo( 100, $.extend( { merge: true }, callbacks ) );

                    afterScroll( function () {
                        expect( callbacks.start ).not.toHaveBeenCalled();
                        expect( callbacks.step ).not.toHaveBeenCalled();
                        expect( callbacks.progress ).not.toHaveBeenCalled();
                        expect( callbacks.done ).not.toHaveBeenCalled();
                        expect( callbacks.complete ).not.toHaveBeenCalled();
                        expect( callbacks.always ).not.toHaveBeenCalled();
                        expect( callbacks.fail ).not.toHaveBeenCalled();
                        done();
                    } );
                } );
            } );

        } );

        describe( 'A scroll movement is in progress, and and another scroll animation is waiting in the queue. Their eventual target location and the target of the new call are the same.', function () {

            it( 'The new scrollTo animation is skipped', function ( done ) {
                // First and second scroll movement.
                $window.scrollTo( 50 ).scrollTo( 100, { append: true } );

                earlyInMidScroll( function () {
                    // Call #3 with identical target, must be ignored.
                    $window.scrollTo( 100, { merge: true } );

                    // As in the first group of tests, we check that the animation is skipped by appending yet another
                    // animation (#4), with a different target. That move is added to the queue. Because it starts
                    // immediately after animations #1 and #2 have finished, its target must be reached after a total of
                    // three scroll periods.
                    $window.scrollTo( 200, { append: true } );
                } );

                afterScrolls( 3, function () {
                    expect( $window.scrollTop() ).toEqual( 200 );
                    done();
                } );
            } );

            it( 'Callbacks of the new scrollTo call do not fire', function ( done ) {
                // First and second scroll movement.
                $window.scrollTo( 50 ).scrollTo( 100, { append: true } );

                earlyInMidScroll( function () {
                    $window.scrollTo( 100, $.extend( { merge: true }, callbacks ) );
                } );

                afterScrolls( 3, function () {
                    expect( callbacks.start ).not.toHaveBeenCalled();
                    expect( callbacks.step ).not.toHaveBeenCalled();
                    expect( callbacks.progress ).not.toHaveBeenCalled();
                    expect( callbacks.done ).not.toHaveBeenCalled();
                    expect( callbacks.complete ).not.toHaveBeenCalled();
                    expect( callbacks.always ).not.toHaveBeenCalled();
                    expect( callbacks.fail ).not.toHaveBeenCalled();
                    done();
                } );
            } );

        } );

    } );

})();