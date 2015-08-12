/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Basic movement.', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {number} */
            maxScrollWidth, maxScrollHeight;

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

                // Give browsers some breathing space to complete the initial setup phase.
                _.delay( done, 50 );

            } );

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


        describe( 'Scrolling vertically.', function () {

            describe( 'Movement.', function () {

                it( 'It scrolls to the bottom with the "bottom" keyword', function ( done ) {
                    $window.scrollTo( "bottom" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls to 100px with target 100 as a numeric value', function ( done ) {
                    $window.scrollTo( 100 );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls to 100px with target "100" as a string value', function ( done ) {
                    $window.scrollTo( "100" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls to 100px with target "100px"', function ( done ) {
                    $window.scrollTo( "100px" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls to 25% of the page height with target "25%"', function ( done ) {
                    $window.scrollTo( "25%" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( Math.round( maxScrollHeight * 0.25 ) );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls down to 150px when starting at 50px with target "+=100"', function ( done ) {
                    $window.scrollTop( 50 ).scrollTo( "+=100" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 150 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls down to 150px when starting at 50px with target "+=100px"', function ( done ) {
                    $window.scrollTop( 50 ).scrollTo( "+=100px" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 150 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls down to 150px when starting at 50px with target "+=100px" (append mode)', function ( done ) {
                    $window.scrollTop( 50 ).scrollTo( "+=100px", { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 150 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls down to 150px when starting at 50px with target "+=100px" (merge mode)', function ( done ) {
                    $window.scrollTop( 50 ).scrollTo( "+=100px", { merge: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 150 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls up to 50px when starting at 150px with target "-=100px"', function ( done ) {
                    $window.scrollTop( 150 ).scrollTo( "-=100px" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 50 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls up to 15% of page height when starting at 40% with target "-=25%"', function ( done ) {
                    // allow a tolerance for rounding when dealing with odd page heights
                    var scrollHeight40percent = maxScrollHeight * 0.4,
                        scrollHeight25percent = maxScrollHeight * 0.25,

                        expectedFloor = Math.floor( scrollHeight40percent ) - Math.ceil( scrollHeight25percent ),
                        expectedCeil = Math.ceil( scrollHeight40percent ) - Math.floor( scrollHeight25percent );

                    $window.scrollTop( scrollHeight40percent ).scrollTo( "-=25%" );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toBeLessThan( expectedCeil + 0.001 );
                        expect( $window.scrollTop() ).toBeGreaterThan( expectedFloor - 0.001 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls up to 15% of page height when starting at 40% with target "-=25%" (append mode)', function ( done ) {
                    // allow a tolerance for rounding when dealing with odd page heights
                    var scrollHeight40percent = maxScrollHeight * 0.4,
                        scrollHeight25percent = maxScrollHeight * 0.25,

                        expectedFloor = Math.floor( scrollHeight40percent ) - Math.ceil( scrollHeight25percent ),
                        expectedCeil = Math.ceil( scrollHeight40percent ) - Math.floor( scrollHeight25percent );

                    $window.scrollTop( scrollHeight40percent ).scrollTo( "-=25%", { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toBeLessThan( expectedCeil + 0.001 );
                        expect( $window.scrollTop() ).toBeGreaterThan( expectedFloor - 0.001 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls up to 15% of page height when starting at 40% with target "-=25%" (merge mode)', function ( done ) {
                    // allow a tolerance for rounding when dealing with odd page heights
                    var scrollHeight40percent = maxScrollHeight * 0.4,
                        scrollHeight25percent = maxScrollHeight * 0.25,

                        expectedFloor = Math.floor( scrollHeight40percent ) - Math.ceil( scrollHeight25percent ),
                        expectedCeil = Math.ceil( scrollHeight40percent ) - Math.floor( scrollHeight25percent );

                    $window.scrollTop( scrollHeight40percent ).scrollTo( "-=25%", { merge: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toBeLessThan( expectedCeil + 0.001 );
                        expect( $window.scrollTop() ).toBeGreaterThan( expectedFloor - 0.001 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls back up to 100px when starting at 150px with target 100', function ( done ) {
                    $window.scrollTop( 150 ).scrollTo( 100 );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls back up to 100px when starting at 150px with target 100 (append mode)', function ( done ) {
                    $window.scrollTop( 150 ).scrollTo( 100, { append: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It scrolls back up to 100px when starting at 150px with target 100 (merge mode)', function ( done ) {
                    $window.scrollTop( 150 ).scrollTo( 100, { merge: true } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Callbacks.', function () {

                /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
                var callbacks,

                    /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
                    callbackCalls,

                    targetPx;

                beforeEach( function ( done ) {
                    callbackCalls = {};
                    callbacks = createObservedCallbacks( callbackCalls, $window );

                    targetPx = 100;
                    $window.scrollTo( targetPx, callbacks );
                    
                    afterScroll( function () {
                        done();
                    } );
                } );

                describe( 'Before the movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks.start ).toHaveBeenCalled();
                        expect( callbackCalls.start.callCount ).toEqual( 1 );
                        expect( callbackCalls.start.scrollState.y ).toEqual( 0 );
                    } );

                } );

                describe( 'Until the movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks.step ).toHaveBeenCalled();
                        expect( callbackCalls.step.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.step.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks.progress ).toHaveBeenCalled();
                        expect( callbackCalls.progress.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.progress.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                } );

                describe( 'When the movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks.done ).toHaveBeenCalled();
                        expect( callbackCalls.done.callCount ).toEqual( 1 );
                        expect( callbackCalls.done.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks.complete ).toHaveBeenCalled();
                        expect( callbackCalls.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls.complete.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks.always ).toHaveBeenCalled();
                        expect( callbackCalls.always.callCount ).toEqual( 1 );
                        expect( callbackCalls.always.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks.fail ).not.toHaveBeenCalled();
                    } );

                } );

                describe( 'When the window is scrolled,', function () {

                    it( 'it binds the "start" callback to the window', function () {
                        expect( callbackCalls.start.context ).toBe( window );
                    } );

                    it( 'it binds the "step" callback to the window', function () {
                        expect( callbackCalls.step.context ).toBe( window );
                    } );

                    it( 'it binds the "progress" callback to the window', function () {
                        expect( callbackCalls.progress.context ).toBe( window );
                    } );

                    it( 'it binds the "done" callback to the window', function () {
                        expect( callbackCalls.done.context ).toBe( window );
                    } );

                    it( 'it binds the "complete" callback to the window', function () {
                        expect( callbackCalls.complete.context ).toBe( window );
                    } );

                    it( 'it binds the "always" callback to the window', function () {
                        expect( callbackCalls.always.context ).toBe( window );
                    } );

                } );

            } );

        } );

        describe( 'Scrolling horizontally.', function () {

            describe( 'Movement.', function () {

                it( 'It scrolls to the right edge with the "right" keyword', function ( done ) {
                    $window.scrollTo( "right" );

                    afterScroll( function () {
                        expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
                        expect( $window.scrollTop() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Callbacks.', function () {

                /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
                var callbacks,

                    /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
                    callbackCalls,

                    targetPx;

                beforeEach( function ( done ) {
                    callbackCalls = {};
                    callbacks = createObservedCallbacks( callbackCalls, $window );

                    targetPx = 100;
                    $window.scrollTo( { x: targetPx }, callbacks );

                    afterScroll( function () {
                        done();
                    } );
                } );

                describe( 'Before the movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks.start ).toHaveBeenCalled();
                        expect( callbackCalls.start.callCount ).toEqual( 1 );
                        expect( callbackCalls.start.scrollState.x ).toEqual( 0 );
                    } );

                } );

                describe( 'Until the movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks.step ).toHaveBeenCalled();
                        expect( callbackCalls.step.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.step.scrollState.x ).toBeGreaterThan( 0 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks.progress ).toHaveBeenCalled();
                        expect( callbackCalls.progress.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.progress.scrollState.x ).toBeGreaterThan( 0 );
                    } );

                } );

                describe( 'When the movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks.done ).toHaveBeenCalled();
                        expect( callbackCalls.done.callCount ).toEqual( 1 );
                        expect( callbackCalls.done.scrollState.x ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks.complete ).toHaveBeenCalled();
                        expect( callbackCalls.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls.complete.scrollState.x ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks.always ).toHaveBeenCalled();
                        expect( callbackCalls.always.callCount ).toEqual( 1 );
                        expect( callbackCalls.always.scrollState.x ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks.fail ).not.toHaveBeenCalled();
                    } );

                } );

                describe( 'When the window is scrolled,', function () {

                    it( 'it binds the "start" callback to the window', function () {
                        expect( callbackCalls.start.context ).toBe( window );
                    } );

                    it( 'it binds the "step" callback to the window', function () {
                        expect( callbackCalls.step.context ).toBe( window );
                    } );

                    it( 'it binds the "progress" callback to the window', function () {
                        expect( callbackCalls.progress.context ).toBe( window );
                    } );

                    it( 'it binds the "done" callback to the window', function () {
                        expect( callbackCalls.done.context ).toBe( window );
                    } );

                    it( 'it binds the "complete" callback to the window', function () {
                        expect( callbackCalls.complete.context ).toBe( window );
                    } );

                    it( 'it binds the "always" callback to the window', function () {
                        expect( callbackCalls.always.context ).toBe( window );
                    } );

                } );

            } );

        } );

        describe( 'Scrolling vertically and horizontally at the same time.', function () {

            describe( 'Movement.', function () {

                it( 'It scrolls to the bottom right edge when passed a position hash with the "bottom" and "right" keywords', function ( done ) {
                    $window.scrollTo( { x: "right", y: "bottom" } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
                        done();
                    } );
                } );

            } );

            describe( 'Callbacks.', function () {

                /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
                var callbacks,

                    /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
                    callbackCalls,

                    xTargetPx, yTargetPx;

                beforeEach( function ( done ) {
                    callbackCalls = {};
                    callbacks = createObservedCallbacks( callbackCalls, $window );

                    xTargetPx = 100;
                    yTargetPx = 150;

                    $window.scrollTo( { x: xTargetPx, y: yTargetPx }, callbacks );

                    afterScroll( function () {
                        done();
                    } );
                } );

                describe( 'Before the movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks.start ).toHaveBeenCalled();
                        expect( callbackCalls.start.callCount ).toEqual( 1 );
                        expect( callbackCalls.start.scrollState.x ).toEqual( 0 );
                        expect( callbackCalls.start.scrollState.y ).toEqual( 0 );
                    } );

                } );

                describe( 'Until the movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks.step ).toHaveBeenCalled();
                        expect( callbackCalls.step.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.step.scrollState.x ).toBeGreaterThan( 0 );
                        expect( callbackCalls.step.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks.progress ).toHaveBeenCalled();
                        expect( callbackCalls.progress.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls.progress.scrollState.x ).toBeGreaterThan( 0 );
                        expect( callbackCalls.progress.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                } );

                describe( 'When the movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks.done ).toHaveBeenCalled();
                        expect( callbackCalls.done.callCount ).toEqual( 1 );
                        expect( callbackCalls.done.scrollState.x ).toFuzzyEqual( xTargetPx );
                        expect( callbackCalls.done.scrollState.y ).toFuzzyEqual( yTargetPx );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks.complete ).toHaveBeenCalled();
                        expect( callbackCalls.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls.complete.scrollState.x ).toFuzzyEqual( xTargetPx );
                        expect( callbackCalls.complete.scrollState.y ).toFuzzyEqual( yTargetPx );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks.always ).toHaveBeenCalled();
                        expect( callbackCalls.always.callCount ).toEqual( 1 );
                        expect( callbackCalls.always.scrollState.x ).toFuzzyEqual( xTargetPx );
                        expect( callbackCalls.always.scrollState.y ).toFuzzyEqual( yTargetPx );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks.fail ).not.toHaveBeenCalled();
                    } );

                } );

                describe( 'When the window is scrolled,', function () {

                    it( 'it binds the "start" callback to the window', function () {
                        expect( callbackCalls.start.context ).toBe( window );
                    } );

                    it( 'it binds the "step" callback to the window', function () {
                        expect( callbackCalls.step.context ).toBe( window );
                    } );

                    it( 'it binds the "progress" callback to the window', function () {
                        expect( callbackCalls.progress.context ).toBe( window );
                    } );

                    it( 'it binds the "done" callback to the window', function () {
                        expect( callbackCalls.done.context ).toBe( window );
                    } );

                    it( 'it binds the "complete" callback to the window', function () {
                        expect( callbackCalls.complete.context ).toBe( window );
                    } );

                    it( 'it binds the "always" callback to the window', function () {
                        expect( callbackCalls.always.context ).toBe( window );
                    } );

                } );

            } );

        } );

    } );

})();