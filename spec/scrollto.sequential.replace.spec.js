/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Sequential movement, in "replace" mode.', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {number} */
            maxScrollWidth, maxScrollHeight,

            /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
            callbacks_1, callbacks_2, callbacks_3, callbacks_4,

            /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
            callbackCalls_1, callbackCalls_2, callbackCalls_3, callbackCalls_4;

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


        describe( 'New movement during ongoing scroll.', function () {

            describe( 'When the new scrollTo command targets the same axis,', function () {

                it( 'it scrolls to the new target location', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        $window.scrollTo( 100 );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );
                } );

                it( 'it bases a relative scroll target on the scroll position at the moment scrollTo was called again', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        var posAtCall = $window.scrollTop();
                        $window.scrollTo( "-=30px" );

                        afterScroll( function () {
                            // NB Ignore sub-pixel differences in the position (they exist in Android)
                            expect( $window.scrollTop() ).toFuzzyEqual( posAtCall - 30, 0 );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );
                } );


            } );

            describe( 'When the new scrollTo command targets a different axis,', function () {

                it( 'it scrolls to the target location on the new axis', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        $window.scrollTo( { x: 100 } );

                        afterScroll( function () {
                            expect( $window.scrollLeft() ).toFuzzyEqual( 100 );
                            done();
                        } );
                    } );
                } );

                it( 'on the original axis, it stays at the scroll position which was reached at the moment scrollTo was called again', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        var posAtCall = $window.scrollTop();
                        $window.scrollTo( { x: 100 } );

                        afterScroll( function () {
                            // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                            // by mobile Safari
                            if ( !isIOS() ) expect( $window.scrollTop() ).toFuzzyEqual( posAtCall );
                            expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );
                            done();
                        } );
                    } );
                } );

            } );

            describe( 'Callbacks.', function () {

                var calledAtPx, targetPx;

                beforeEach( function ( done ) {
                    targetPx = 100;

                    $window.scrollTo( "bottom", callbacks_1 );

                    inMidScroll( function () {
                        calledAtPx = $window.scrollTop();
                        $window.scrollTo( targetPx, callbacks_2 );

                        afterScroll( function () {
                            done();
                        } );
                    } );

                } );

                describe( 'For the initial scrollTo call,', function () {

                    it( 'the "done" callback has not fired', function () {
                        expect( callbacks_1.done ).not.toHaveBeenCalled();
                    } );

                    it( 'the "complete" callback has not fired', function () {
                        expect( callbacks_1.complete ).not.toHaveBeenCalled();
                    } );

                    it( 'the "fail" callback has fired', function () {
                        expect( callbacks_1.fail ).toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_1.always ).toHaveBeenCalled();
                    } );

                } );

                describe( 'Before the new movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks_2.start ).toHaveBeenCalled();
                        expect( callbackCalls_2.start.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.start.scrollState.y ).toFuzzyEqual( calledAtPx );
                    } );

                } );

                describe( 'Until the new movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks_2.step ).toHaveBeenCalled();
                        expect( callbackCalls_2.step.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls_2.step.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks_2.progress ).toHaveBeenCalled();
                        expect( callbackCalls_2.progress.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls_2.progress.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                } );

                describe( 'When the new movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks_2.done ).toHaveBeenCalled();
                        expect( callbackCalls_2.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.done.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks_2.complete ).toHaveBeenCalled();
                        expect( callbackCalls_2.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.complete.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks_2.always ).toHaveBeenCalled();
                        expect( callbackCalls_2.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.always.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks_2.fail ).not.toHaveBeenCalled();
                    } );

                } );

            } );

        } );

        describe( 'scrollTo is called several times at once (four times).', function () {

            describe( 'Movement.', function () {

                it( 'The target of the last scrollTo call prevails', function ( done ) {
                    // Implicitly also tests that the overridden scrollTo calls do not prolong the execution time. They are
                    // overridden immediately, so they should not affect the timing.
                    //
                    // That is why the afterScroll does not get an extended wait time passed.
                    $window
                        .scrollTo( 50 )
                        .scrollTo( 200 )
                        .scrollTo( 100 )
                        .scrollTo( 150 );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 150 );
                        done();
                    } );
                } );

            } );

            describe( 'Callbacks.', function () {

                var targetPx;

                beforeEach( function ( done ) {
                    targetPx = 150;

                    $window
                        .scrollTo( 50, callbacks_1 )
                        .scrollTo( 200, callbacks_2 )
                        .scrollTo( 100, callbacks_3 )
                        .scrollTo( targetPx, callbacks_4 );

                    afterScroll( function () {
                        done();
                    } );
                } );

                describe( 'For the first scrollTo call,', function () {

                    it( 'the "done" callback has not fired', function () {
                        expect( callbacks_1.done ).not.toHaveBeenCalled();
                    } );

                    it( 'the "complete" callback has not fired', function () {
                        expect( callbacks_1.complete ).not.toHaveBeenCalled();
                    } );

                    it( 'the "fail" callback has fired', function () {
                        expect( callbacks_1.fail ).toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_1.always ).toHaveBeenCalled();
                    } );

                } );

                describe( 'For the second scrollTo call,', function () {

                    it( 'the "done" callback has not fired', function () {
                        expect( callbacks_2.done ).not.toHaveBeenCalled();
                    } );

                    it( 'the "complete" callback has not fired', function () {
                        expect( callbacks_2.complete ).not.toHaveBeenCalled();
                    } );

                    it( 'the "fail" callback has fired', function () {
                        expect( callbacks_2.fail ).toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_2.always ).toHaveBeenCalled();
                    } );

                } );

                describe( 'For the third scrollTo call,', function () {

                    it( 'the "done" callback has not fired', function () {
                        expect( callbacks_3.done ).not.toHaveBeenCalled();
                    } );

                    it( 'the "complete" callback has not fired', function () {
                        expect( callbacks_3.complete ).not.toHaveBeenCalled();
                    } );

                    it( 'the "fail" callback has fired', function () {
                        expect( callbacks_3.fail ).toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_3.always ).toHaveBeenCalled();
                    } );

                } );

                describe( 'Before the final movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks_4.start ).toHaveBeenCalled();
                        expect( callbackCalls_4.start.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.start.scrollState.y ).toEqual( 0 );
                    } );

                } );

                describe( 'Until the final movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks_4.step ).toHaveBeenCalled();
                        expect( callbackCalls_4.step.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls_4.step.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks_4.progress ).toHaveBeenCalled();
                        expect( callbackCalls_4.progress.callCount ).toBeGreaterThan( 1 );
                        expect( callbackCalls_4.progress.scrollState.y ).toBeGreaterThan( 0 );
                    } );

                } );

                describe( 'When the final movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks_4.done ).toHaveBeenCalled();
                        expect( callbackCalls_4.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.done.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks_4.complete ).toHaveBeenCalled();
                        expect( callbackCalls_4.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.complete.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks_4.always ).toHaveBeenCalled();
                        expect( callbackCalls_4.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.always.scrollState.y ).toFuzzyEqual( targetPx );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks_4.fail ).not.toHaveBeenCalled();
                    } );

                } );

            } );

        } );

    } );

})();