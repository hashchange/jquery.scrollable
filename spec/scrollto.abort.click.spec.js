/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Aborted movement, due to user clicks or taps.', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {number} */
            maxScrollWidth, maxScrollHeight,

            /** @type {number}  the number of px within which an aborted scroll movement must stop, relative to where it was initiated */
            abortTolerance,

            /** @type {number}  the number of px which a scroll movement can fall short of reaching its intended target
             *                  (used in conjunction with abortTolerance, which describes tolerance on the other side of
             *                  that target */
            borderFuzziness,

            userClickDetectionEnabled = $.scrollable._enableClickAndTouchDetection,

            msgTestSkippedDetectionDisabled = 'Skipped because user click and touch detection is disabled ($.scrollable._enableClickAndTouchDetection = false)',

            msgTestSkippedNoTouchUI = 'Skipped because the browser does not support a touch-enabled UI';


        beforeEach( function ( done ) {
            var fixtureCss = [
                "body { width: 3000px; height: 3000px; }",
                "html, body { margin: 0; padding: 0; border: none; }"
            ];

            f = Setup.create( "window", f, { createEl: false, injectCss: fixtureCss } );

            $window = $( window );

            abortTolerance = 1;
            borderFuzziness = 2;

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

                // Some browsers need a little extra time to get their act together.
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

            describeIf( userClickDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user clicks in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userClicks( $window );
                    } );

                    afterScroll( function () {

                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                itIf( supportsTouchUI(), msgTestSkippedNoTouchUI, 'when the user taps in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    // Tap early, the tap itself takes 100ms to complete. The userTarget is not accurate until 125ms
                    // after tap start.
                    earlyInMidScroll( function () {
                        userTarget = userTaps( $window, { capturePositionAsync: true } );
                    } );

                    afterScroll( function () {

                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling horizontally.', function () {

            describeIf( userClickDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user clicks in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userClicks( $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );

                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );

                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                        done();
                    } );
                } );

                itIf( supportsTouchUI(), msgTestSkippedNoTouchUI, 'when the user taps in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    // Tap early, the tap itself takes 100ms to complete. The userTarget is not accurate until 125ms
                    // after tap start.
                    earlyInMidScroll( function () {
                        userTarget = userTaps( $window, { capturePositionAsync: true } );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );

                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );

                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Clearing the queue.', function () {

            describeIf( userClickDetectionEnabled, msgTestSkippedDetectionDisabled, 'When the user clicks while some scroll animations are still waiting in the queue,', function () {
                var userTarget;

                beforeEach( function ( done ) {

                    // IE 9 needed some extra time to recover after each test. Adding a delay of 100ms.
                    _.delay( function () {

                        $window
                            .scrollTo( "bottom" )
                            .scrollTo( "right", { append: true } )
                            .scrollTo( "top", { append: true } )
                            .scrollTo( "90%", { axis: "x", append: true } );

                        inMidScroll( function () {
                            userTarget = userClicks( $window );
                            done();
                        } );

                    }, 100 );

                } );

                it( 'the ongoing animation is aborted', function ( done ) {
                    afterScroll( function () {
                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                    } );

                    afterScrolls( 4, done );
                } );

                it( 'the queued animations are removed as well', function ( done ) {
                    afterScrolls( 4, function () {
                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

        } );

        describeIf( userClickDetectionEnabled, msgTestSkippedDetectionDisabled, 'Callbacks.', function () {

            /** @type {Object}  holds animation callback functions of all types; functions are created with getCallbackLogger */
            var callbacks_1, callbacks_2,

                /** @type {Object}  collects info about callback calls, populated by functions which are created with getCallbackLogger */
                callbackCalls_1, callbackCalls_2,

                userTarget;

            beforeEach( function ( done ) {
                callbackCalls_1 = {};
                callbackCalls_2 = {};
                callbacks_1 = createObservedCallbacks( callbackCalls_1, $window );
                callbacks_2 = createObservedCallbacks( callbackCalls_2, $window );

                $window
                    .scrollTo( "bottom", callbacks_1 )
                    .scrollTo( "right", $.extend( { append: true }, callbacks_2 ) );

                inMidScroll( function () {
                    userTarget = userClicks( $window );
                } );

                afterScrolls( 2, done );
            } );

            describe( 'For an animation which is aborted because of a user click,', function () {

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
                    expect( callbackCalls_1.always.scrollState.x ).toFuzzyEqual( userTarget.x );

                    // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                    // by mobile Safari
                    if ( !isIOS() ) expect( callbackCalls_1.always.scrollState.y ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedStrictlyAbove( maxScrollHeight );
                } );

                it( 'the "always" callback is called with a cancelled: "click" message as the third argument', function () {
                    var args = callbackCalls_1.always.args;
                    expect( args ).toBeArray();
                    expect( args.length ).toEqual( 3 );
                    expect( args[2] ).toBeNonEmptyObject();
                    expect( args[2].cancelled ).toEqual( "click" );
                } );

                it( 'the fail callback runs', function () {
                    expect( callbacks_1.fail ).toHaveBeenCalled();
                    expect( callbackCalls_1.fail.callCount ).toEqual( 1 );
                    expect( callbackCalls_1.fail.scrollState.x ).toFuzzyEqual( userTarget.x );

                    // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                    // by mobile Safari
                    if ( !isIOS() )  expect( callbackCalls_1.always.scrollState.y ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedStrictlyAbove( maxScrollHeight );
                } );

                it( 'the fail callback is called with a cancelled: "click" message as the third argument', function () {
                    var args = callbackCalls_1.fail.args;
                    expect( args ).toBeArray();
                    expect( args.length ).toEqual( 3 );
                    expect( args[2] ).toBeNonEmptyObject();
                    expect( args[2].cancelled ).toEqual( "click" );
                } );

            } );

            describe( 'For an animation which is removed from the queue because of a user click,', function () {

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

        describeIf( userClickDetectionEnabled, msgTestSkippedDetectionDisabled, 'Ignoring user clicks with the ignoreUser option.', function () {

            describe( 'Setting the ignoreUser option to true', function () {

                it( 'When the user clicks, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: true } );

                    inMidScroll( function () {
                        userTarget = userClicks( $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "click"', function () {

                it( 'When the user clicks, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "click" } );

                    inMidScroll( function () {
                        userTarget = userClicks( $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "scroll"', function () {

                it( 'When the user clicks, the scroll animation is stopped as usual', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "scroll" } );

                    inMidScroll( function () {
                        userTarget = userClicks( $window );
                    } );

                    afterScroll( function () {
                        // We have to disable this expectation in iOS due to a lack of accuracy in the values reported
                        // by mobile Safari
                        if ( !isIOS() ) expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );

                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

        } );

        describeIf( userClickDetectionEnabled && supportsTouchUI(), !userClickDetectionEnabled ? msgTestSkippedDetectionDisabled : msgTestSkippedNoTouchUI, 'Ignoring user taps with the ignoreUser option.', function () {

            describe( 'Setting the ignoreUser option to true', function () {

                it( 'When the user taps, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: true } );

                    // Tap early, the tap itself takes 100ms to complete. The userTarget is not accurate until 125ms
                    // after tap start.
                    earlyInMidScroll( function () {
                        userTarget = userTaps( $window, { capturePositionAsync: true } );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "click"', function () {

                it( 'When the user taps, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "click" } );

                    // Tap early, the tap itself takes 100ms to complete. The userTarget is not accurate until 125ms
                    // after tap start.
                    earlyInMidScroll( function () {
                        userTarget = userTaps( $window, { capturePositionAsync: true } );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "scroll"', function () {

                it( 'When the user taps, the scroll animation is stopped as usual', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "scroll" } );

                    // Tap early, the tap itself takes 100ms to complete. The userTarget is not accurate until 125ms
                    // after tap start.
                    earlyInMidScroll( function () {
                        userTarget = userTaps( $window, { capturePositionAsync: true } );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

        } );

    } );

})();