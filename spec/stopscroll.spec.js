/*global describe, it */
(function () {
    "use strict";

    describe( 'stopScroll().', function () {

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

                // Give browsers some breathing space to complete the initial setup phase.
                _.delay( done, 50 );

            } );
        } );

        afterEach( function () {
            f.cleanDom();
            restoreDefaultDurationForAnimations();
        } );

        afterAll( function () {
            $window.scrollTop( 0 ).scrollLeft( 0 );
            f.shutdown();
        } );


        describe( 'stopScroll is called in mid movement.', function () {

            describe( 'Movement stops', function () {

                it( 'when scrolling vertically', function ( done ) {
                    var stopLocation;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        $window.stopScroll();
                        stopLocation = getCurrentScrollLocation( $window );
                    } );

                    afterScroll( function () {
                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollTop() ).toFuzzyEqual( stopLocation.y );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when scrolling horizontally', function ( done ) {
                    var stopLocation;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        $window.stopScroll();
                        stopLocation = getCurrentScrollLocation( $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );

                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollLeft() ).toFuzzyEqual( stopLocation.x );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );

                        done();
                    } );
                } );

                it( 'when scrolling on both axes', function ( done ) {
                    var stopLocation;
                    $window.scrollTo( { x: "right", y: "bottom" } );

                    inMidScroll( function () {
                        $window.stopScroll();
                        stopLocation = getCurrentScrollLocation( $window );
                    } );

                    afterScroll( function () {
                        // We have to disable these expectations in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) {
                            expect( $window.scrollTop() ).toFuzzyEqual( stopLocation.y );
                            expect( $window.scrollLeft() ).toFuzzyEqual( stopLocation.x );
                        }

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Clearing the queue.', function () {

            describe( 'When calling stopScroll while some scroll animations are still waiting in the queue,', function () {
                var stopLocation;

                beforeEach( function ( done ) {

                    // IE 9 needed some extra time to recover after each test. Adding a delay of 100ms.
                    _.delay( function () {

                        $window
                            .scrollTo( "bottom" )
                            .scrollTo( "right", { append: true } )
                            .scrollTo( "top", { append: true } )
                            .scrollTo( "90%", { axis: "x", append: true } );

                        inMidScroll( function () {
                            $window.stopScroll();
                            stopLocation = getCurrentScrollLocation( $window );
                            done();
                        } );

                    }, 100 );

                } );

                it( 'the ongoing animation is aborted', function ( done ) {
                    afterScroll( function () {
                        // We have to disable these expectations in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) {
                            expect( $window.scrollTop() ).toFuzzyEqual( stopLocation.y );
                            expect( $window.scrollLeft() ).toFuzzyEqual( stopLocation.x );
                        }

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                    } );

                    afterScrolls( 4, done );
                } );

                it( 'the queued animations are removed as well', function ( done ) {
                    afterScrolls( 4, function () {
                        // We have to disable these expectations in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) {
                            expect( $window.scrollTop() ).toFuzzyEqual( stopLocation.y );
                            expect( $window.scrollLeft() ).toFuzzyEqual( stopLocation.x );
                        }

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyBelow( 0 );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );
        } );

        describe( 'Callbacks.', function () {

                /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
                var callbacks_1, callbacks_2,

                    /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
                    callbackCalls_1, callbackCalls_2,

                    stopLocation;

                beforeEach( function ( done ) {
                    callbackCalls_1 = {};
                    callbackCalls_2 = {};
                    callbacks_1 = createObservedCallbacks( callbackCalls_1, $window );
                    callbacks_2 = createObservedCallbacks( callbackCalls_2, $window );

                    $window
                        .scrollTo( "bottom", callbacks_1 )
                        .scrollTo( "right", $.extend( { append: true }, callbacks_2 ) );

                    inMidScroll( function () {
                        $window.stopScroll();
                        stopLocation = getCurrentScrollLocation( $window );
                        done();
                    } );

                    afterScrolls( 2, done );
                } );

            describe( 'For an animation which is aborted by stopScroll,', function () {

                it( 'the "start" callback runs', function () {
                    expect( callbacks_1.start ).toHaveBeenCalled();
                    expect( callbackCalls_1.start.callCount ).toEqual( 1 );
                } );

                it( 'the "step" callback runs repeatedly', function () {
                    expect( callbacks_1.step ).toHaveBeenCalled();
                    expect( callbackCalls_1.step.callCount ).toBeGreaterThan( 1 );
                } );

                it( 'the "progress" callback runs repeatedly', function () {
                    expect( callbacks_1.progress ).toHaveBeenCalled();
                    expect( callbackCalls_1.progress.callCount ).toBeGreaterThan( 1 );
                } );

                it( 'the "done" callback does not run', function () {
                    expect( callbacks_1.done ).not.toHaveBeenCalled();
                } );

                it( 'the "complete" callback does not run', function () {
                    expect( callbacks_1.complete ).not.toHaveBeenCalled();
                } );

                it( 'the "always" callback runs', function () {
                    expect( callbacks_1.always ).toHaveBeenCalled();
                    expect( callbackCalls_1.always.callCount ).toEqual( 1 );

                    // We have to disable these expectations in iOS due to a lack of accuracy in the values reported
                    // by mobile Safari
                    if ( !isIOS() ) {
                        expect( callbackCalls_1.always.scrollState.x ).toFuzzyEqual( stopLocation.x );
                        expect( callbackCalls_1.always.scrollState.y ).toFuzzyEqual( stopLocation.y );
                    }

                    expect( callbackCalls_1.always.scrollState.x ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedStrictlyAbove( maxScrollHeight );
                } );

                it( 'the fail callback runs', function () {
                    expect( callbacks_1.fail ).toHaveBeenCalled();
                    expect( callbackCalls_1.fail.callCount ).toEqual( 1 );
                    expect( callbackCalls_1.fail.scrollState.x ).toFuzzyEqual( stopLocation.x );
                    expect( callbackCalls_1.fail.scrollState.y ).toFuzzyEqual( stopLocation.y );
                } );

            } );

            describe( 'For an animation which is removed from the queue by stopScroll,', function () {

                it( 'the "start" callback does not run', function () {
                    expect( callbacks_2.start ).not.toHaveBeenCalled();
                } );

                it( 'the "step" callback does not run', function () {
                    expect( callbacks_2.step ).not.toHaveBeenCalled();
                } );

                it( 'the "progress" callback does not run', function () {
                    expect( callbacks_2.progress ).not.toHaveBeenCalled();
                } );

                it( 'the "done" callback does not run', function () {
                    expect( callbacks_2.done ).not.toHaveBeenCalled();
                } );

                it( 'the "complete" callback does not run', function () {
                    expect( callbacks_2.complete ).not.toHaveBeenCalled();
                } );

                it( 'the "always" callback does not run', function () {
                    expect( callbacks_2.always ).not.toHaveBeenCalled();
                } );

                it( 'the fail callback does not run', function () {
                    expect( callbacks_2.fail ).not.toHaveBeenCalled();
                } );

            } );

        } );

    } );

})();