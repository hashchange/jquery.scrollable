/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Aborted movement', function () {

        /** @type {DOMFixture}  populated by Setup.create() */
        var f,

            /** @type {jQuery} */
            $window,

            /** @type {number} */
            maxScrollWidth, maxScrollHeight,

            /** @type {number}  the number of px a user scrolls, in an intentional move */
            intentionalUserScrollMovement,

            /** @type {number}  the number of px a user scrolls, in an accidental move */
            accidentalUserScrollMovement,

            userScrollDetectionEnabled = $.scrollable._enableUserScrollDetection,

            /** @type {boolean}  true if there is a default user scroll threshold */
            hasUserScrollThreshold = $.scrollable.userScrollThreshold > 0,

            msgTestSkippedDetectionDisabled = 'Skipped because user scroll detection is disabled ($.scrollable._enableUserScrollDetection = false)',

            msgTestSkippedNoThreshold = 'Skipped because the default user scroll threshold is set to 0 ($.scrollable.userScrollThreshold = 0)';


        beforeEach( function ( done ) {
            var fixtureCss = [
                "body { width: 3000px; height: 3000px; }",
                "html, body { margin: 0; padding: 0; border: none; }"
            ];

            f = Setup.create( "window", f, { createEl: false, injectCss: fixtureCss } );

            $window = $( window );
            maxScrollWidth = 3000 - $window.width();
            maxScrollHeight = 3000 - $window.height();

            $window.scrollTop( 0 ).scrollLeft( 0 );

            intentionalUserScrollMovement = Math.max( $.scrollable.userScrollThreshold + 1, 1 );
            accidentalUserScrollMovement = Math.max( $.scrollable.userScrollThreshold, 1 );

            // Reduce the default duration for animations in order to speed up the tests
            reduceDefaultDurationForAnimations();

            // Some browsers need a little extra time to get their act together.
            _.delay( done, 50 );
        } );

        afterEach( function () {
            f.cleanDom();
            restoreDefaultDurationForAnimations();
        } );

        afterAll( function () {
            f.shutdown();
        } );


        describe( 'Scrolling down vertically', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls vertically, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, in the opposite direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the right, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the left, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollLeft( 100 );

                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold, msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls vertically, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, in the opposite direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the right, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the left, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollLeft( 100 );

                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling up vertically', function () {

            beforeEach( function () {
                $window.scrollTop( maxScrollHeight );
            } );

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls vertically, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, in the opposite direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the right, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the left, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollLeft( 100 );

                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold, msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls vertically, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, in the opposite direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the right, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, to the left, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollLeft( 100 );

                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling horizontally, to the right', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls horizontally, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, in the opposite direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, downwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold, msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls horizontally, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( maxScrollWidth );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, in the opposite direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( maxScrollWidth );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, downwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( maxScrollWidth );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( maxScrollWidth );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling horizontally, to the left', function () {

            beforeEach( function () {
                $window.scrollLeft( maxScrollWidth );
            } );

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls horizontally, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, in the opposite direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, downwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold, msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls horizontally, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: -accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls horizontally, in the opposite direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, downwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    $window.scrollTo( "left" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Clearing the queue', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'When the user scrolls while some scroll animations are still waiting in the queue', function () {
                var userTarget;

                beforeEach( function ( done ) {

                    $window
                        .scrollTo( "bottom" )
                        .scrollTo( "right", { append: true } )
                        .scrollTo( "top", { append: true } )
                        .scrollTo( "90%", { axis: "x", append: true } );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                        done();
                    } );

                } );

                it( 'the ongoing animation is aborted', function ( done ) {
                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                    } );

                    afterScrolls( 4, done );
                } );

                it( 'the queued animations are removed as well', function ( done ) {
                    afterScrolls( 4, function () {
                        expect( $window.scrollTop() ).toEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( userTarget.x );
                        done();
                    } );
                } );

            } );
        } );

        describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Callbacks', function () {

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
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScrolls( 2, done );
                } );

            describe( 'For an animation which is aborted due to user scrolling', function () {

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
                    expect( callbackCalls_1.always.scrollState.x ).toEqual( userTarget.x );
                    expect( callbackCalls_1.always.scrollState.y ).toEqual( userTarget.y );
                } );

                it( 'the fail callback runs', function () {
                    expect( callbacks_1.fail ).toHaveBeenCalled();
                    expect( callbackCalls_1.fail.callCount ).toEqual( 1 );
                    expect( callbackCalls_1.fail.scrollState.x ).toEqual( userTarget.x );
                    expect( callbackCalls_1.fail.scrollState.y ).toEqual( userTarget.y );
                } );

            } );

            describe( 'For an animation which is removed from the queue due to user scrolling', function () {

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

        describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Changing the userScrollThreshold', function () {

            describe( 'Changing the global value', function () {

                describe( 'The threshold is reduced to 0', function () {

                    beforeEach( function () {
                        $.scrollable.userScrollThreshold = 0;
                    } );

                    it( 'When the user scrolls by as little as 1px, the scroll animation is stopped', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 1, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is increased to 100', function () {
                    var defaultThreshold;

                    beforeEach( function () {
                        defaultThreshold = $.scrollable.userScrollThreshold;
                        $.scrollable.userScrollThreshold = 100;
                    } );

                    afterEach( function () {
                        $.scrollable.userScrollThreshold = defaultThreshold;
                    } );

                    it( 'When the user scrolls by 100px, the scroll animation continues', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 100, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                    it( 'When the user scrolls by 101px, the scroll animation is stopped', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 101, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

            } );

            describe( 'Using the userScrollThreshold option', function () {

                describe( 'The threshold is reduced to 0', function () {

                    it( 'When the user scrolls by as little as 1px, the scroll animation is stopped', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom", { userScrollThreshold: 0 } );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 1, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is increased to 100', function () {

                    it( 'When the user scrolls by 100px, the scroll animation continues', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom", { userScrollThreshold: 100 } );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 100, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( maxScrollHeight );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                    it( 'When the user scrolls by 101px, the scroll animation is stopped', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom", { userScrollThreshold: 100 } );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 101, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

            } );
        } );

    } );

})();