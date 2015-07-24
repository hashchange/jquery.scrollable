/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Sequential movement, in "append" mode.', function () {

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
        } );

        afterAll( function () {
            f.shutdown();
        } );


        describe( 'New movement during ongoing scroll.', function () {

            describe( 'Movement.', function () {

                it( 'It first scrolls to the initial target location', function ( done ) {
                    $window.scrollTo( "bottom", { complete: function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                    } } );

                    inMidScroll( function () {
                        $window.scrollTo( 100, { append: true } );

                        afterScroll( function () {
                            done();
                        } );
                    } );
                } );

                it( 'It then scrolls to the new target location', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        $window.scrollTo( 100, { append: true } );
                    } );

                    afterScrolls( 2, function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'It bases a relative scroll target on the target position of the first scrollTo call', function ( done ) {
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        $window.scrollTo( "-=30px", { append: true } );
                    } );

                    afterScrolls( 2, function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight - 30 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );


            } );

            describe( 'Callbacks.', function () {

                var targetPx_1, targetPx_2;

                beforeEach( function ( done ) {
                    targetPx_1 = maxScrollHeight; // same as target "bottom"
                    targetPx_2 = 100;

                    $window.scrollTo( targetPx_1, callbacks_1 );

                    inMidScroll( function () {
                        $window.scrollTo( targetPx_2, $.extend( { append: true }, callbacks_2 ) );
                    } );

                    afterScrolls( 2, function () {
                        done();
                    } );
                } );

                describe( 'For the initial scrollTo call,', function () {

                    it( 'the "done" callback has fired', function () {
                        expect( callbacks_1.done ).toHaveBeenCalled();
                        expect( callbackCalls_1.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.done.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                    it( 'the "complete" callback has fired', function () {
                        expect( callbacks_1.complete ).toHaveBeenCalled();
                        expect( callbackCalls_1.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.complete.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                    it( 'the "fail" callback has not fired', function () {
                        expect( callbacks_1.fail ).not.toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_1.always ).toHaveBeenCalled();
                        expect( callbackCalls_1.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.always.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                } );

                describe( 'Before the new movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks_2.start ).toHaveBeenCalled();
                        expect( callbackCalls_2.start.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.start.scrollState.y ).toFuzzyEqual( targetPx_1 );
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
                        expect( callbackCalls_2.done.scrollState.y ).toFuzzyEqual( targetPx_2 );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks_2.complete ).toHaveBeenCalled();
                        expect( callbackCalls_2.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.complete.scrollState.y ).toFuzzyEqual( targetPx_2 );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks_2.always ).toHaveBeenCalled();
                        expect( callbackCalls_2.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.always.scrollState.y ).toFuzzyEqual( targetPx_2 );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks_2.fail ).not.toHaveBeenCalled();
                    } );

                } );

            } );

        } );

        describe( 'scrollTo is called several times at once (four times) with the append option.', function () {

            describe( 'Movement.', function () {

                beforeEach( function ( done ) {
                    $window
                        .scrollTo( "bottom" )
                        .scrollTo( "right", { append: true } )
                        .scrollTo( { y: 100 }, { append: true } )
                        .scrollTo( { x: 150 }, { append: true } );

                    afterScrolls( 4, function () {
                        done();
                    } );
                } );

                it( 'The target of the last scrollTo call prevails', function ( done ) {
                    expect( $window.scrollLeft() ).toFuzzyEqual( 150 );
                    done();
                } );

                it( 'On an axis which the last scrollTo call did not specify, the last preceding call for that axis prevails', function ( done ) {
                    expect( $window.scrollTop() ).toFuzzyEqual( 100 );
                    done();
                } );

            } );

            describe( 'Callbacks.', function () {

                var targetPx_1, targetPx_2, targetPx_3, targetPx_4;

                beforeEach( function ( done ) {
                    targetPx_1 = maxScrollHeight;  // same as "bottom"
                    targetPx_2 = maxScrollWidth;   // same as "right"
                    targetPx_3 = 100;
                    targetPx_4 = 150;

                    $window
                        .scrollTo( { y: targetPx_1 }, $.extend( { append: true }, callbacks_1 ) )
                        .scrollTo( { x: targetPx_2 }, $.extend( { append: true }, callbacks_2 ) )
                        .scrollTo( { y: targetPx_3 }, $.extend( { append: true }, callbacks_3 ) )
                        .scrollTo( { x: targetPx_4 }, $.extend( { append: true }, callbacks_4 ) );

                    afterScrolls( 4, function () {
                        done();
                    } );
                } );

                describe( 'For the first scrollTo call,', function () {

                    it( 'the "done" callback has fired', function () {
                        expect( callbacks_1.done ).toHaveBeenCalled();
                        expect( callbackCalls_1.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.done.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                    it( 'the "complete" callback has fired', function () {
                        expect( callbacks_1.complete ).toHaveBeenCalled();
                        expect( callbackCalls_1.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.complete.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                    it( 'the "fail" callback has not fired', function () {
                        expect( callbacks_1.fail ).not.toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_1.always ).toHaveBeenCalled();
                        expect( callbackCalls_1.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_1.always.scrollState.y ).toFuzzyEqual( targetPx_1 );
                    } );

                } );

                describe( 'For the second scrollTo call,', function () {

                    it( 'the "done" callback has fired', function () {
                        expect( callbacks_2.done ).toHaveBeenCalled();
                        expect( callbackCalls_2.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.done.scrollState.x ).toFuzzyEqual( targetPx_2 );
                    } );

                    it( 'the "complete" callback has fired', function () {
                        expect( callbacks_2.complete ).toHaveBeenCalled();
                        expect( callbackCalls_2.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.complete.scrollState.x ).toFuzzyEqual( targetPx_2 );
                    } );

                    it( 'the "fail" callback has not fired', function () {
                        expect( callbacks_2.fail ).not.toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_2.always ).toHaveBeenCalled();
                        expect( callbackCalls_2.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_2.always.scrollState.x ).toFuzzyEqual( targetPx_2 );
                    } );

                } );

                describe( 'For the third scrollTo call,', function () {

                    it( 'the "done" callback has fired', function () {
                        expect( callbacks_3.done ).toHaveBeenCalled();
                        expect( callbackCalls_3.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_3.done.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                    it( 'the "complete" callback has fired', function () {
                        expect( callbacks_3.complete ).toHaveBeenCalled();
                        expect( callbackCalls_3.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_3.complete.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                    it( 'the "fail" callback has not fired', function () {
                        expect( callbacks_3.fail ).not.toHaveBeenCalled();
                    } );

                    it( 'the "always" callback has fired', function () {
                        expect( callbacks_3.always ).toHaveBeenCalled();
                        expect( callbackCalls_3.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_3.always.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                } );

                describe( 'Before the final movement starts,', function () {

                    it( 'it fires the "start" callback', function () {
                        expect( callbacks_4.start ).toHaveBeenCalled();
                        expect( callbackCalls_4.start.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.start.scrollState.x ).toFuzzyEqual( targetPx_2 );
                        expect( callbackCalls_4.start.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                } );

                describe( 'Until the final movement is complete,', function () {

                    it( 'it fires the "step" callback repeatedly', function () {
                        expect( callbacks_4.step ).toHaveBeenCalled();
                        expect( callbackCalls_4.step.callCount ).toBeGreaterThan( 1 );
                    } );

                    it( 'it fires the "progress" callback repeatedly', function () {
                        expect( callbacks_4.progress ).toHaveBeenCalled();
                        expect( callbackCalls_4.progress.callCount ).toBeGreaterThan( 1 );
                    } );

                } );

                describe( 'When the final movement is complete,', function () {

                    it( 'it fires the "done" callback', function () {
                        expect( callbacks_4.done ).toHaveBeenCalled();
                        expect( callbackCalls_4.done.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.done.scrollState.x ).toFuzzyEqual( targetPx_4 );
                        expect( callbackCalls_4.done.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                    it( 'it fires the "complete" callback', function () {
                        expect( callbacks_4.complete ).toHaveBeenCalled();
                        expect( callbackCalls_4.complete.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.complete.scrollState.x ).toFuzzyEqual( targetPx_4 );
                        expect( callbackCalls_4.complete.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                    it( 'it fires the "always" callback', function () {
                        expect( callbacks_4.always ).toHaveBeenCalled();
                        expect( callbackCalls_4.always.callCount ).toEqual( 1 );
                        expect( callbackCalls_4.always.scrollState.x ).toFuzzyEqual( targetPx_4 );
                        expect( callbackCalls_4.always.scrollState.y ).toFuzzyEqual( targetPx_3 );
                    } );

                    it( 'it has not fired the fail callback', function () {
                        expect( callbacks_4.fail ).not.toHaveBeenCalled();
                    } );

                } );

            } );

        } );

    } );

})();