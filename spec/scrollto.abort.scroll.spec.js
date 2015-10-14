/*global describe, it */
(function () {
    "use strict";

    describe( 'scrollTo(): Aborted movement, due to user scrolling.', function () {

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

            /** @type {number}  the number of px within which an aborted scroll movement must stop, relative to where it was initiated */
            abortTolerance,

            /** @type {number}  the number of px which a scroll movement can fall short of reaching its intended target
             *                  (used in conjunction with abortTolerance, which describes tolerance on the other side of
             *                  that target */
            borderFuzziness,

            userScrollDetectionEnabled = $.scrollable._enableUserScrollDetection,

            /** @type {boolean}  true if there is a default user scroll threshold */
            hasUserScrollThreshold = $.scrollable.userScrollThreshold > 0,

            msgTestSkippedDetectionDisabled = 'Skipped because user scroll detection is disabled ($.scrollable._enableUserScrollDetection = false)',

            msgTestSkippedNoThreshold = 'Skipped because the default user scroll threshold is set to 0 ($.scrollable.userScrollThreshold = 0)',

            msgTestSkippedUnreliableIOS = "Skipped because the values reported by the browser are too unreliable in iOS to make the test work";


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

                // We give a bit of extra leeway with the borderFuzziness variable (specifically for Chrome on Android)
                intentionalUserScrollMovement = Math.max( $.scrollable.userScrollThreshold + 1 + borderFuzziness, 1 );
                accidentalUserScrollMovement = Math.max( $.scrollable.userScrollThreshold - borderFuzziness, 1 );

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


        describe( 'Scrolling down vertically.', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls vertically, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {

                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

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
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

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
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
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
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold && !isIOS(), isIOS() ? msgTestSkippedUnreliableIOS : msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls vertically, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling up vertically.', function () {

            beforeEach( function ( done ) {
                $window.scrollTop( maxScrollHeight );

                // Add a delay. In iOS, the position is *not* reached instantly, needs a timeout
                afterScreenUpdate( done );
            } );

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls vertically, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "top" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toBeLocatedCloselyAbove( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyBelow( 0 );

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
                        expect( $window.scrollTop() ).toBeLocatedCloselyAbove( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyBelow( 0 );

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
                        expect( $window.scrollTop() ).toBeLocatedCloselyAbove( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyBelow( 0 );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
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
                        expect( $window.scrollTop() ).toBeLocatedCloselyAbove( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyBelow( 0 );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold && !isIOS(), isIOS() ? msgTestSkippedUnreliableIOS : msgTestSkippedNoThreshold, 'Movement does not stop', function () {

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
                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
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
                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );

        } );

        describe( 'Scrolling horizontally, to the right.', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Movement stops', function () {

                it( 'when the user scrolls horizontally, in the same direction, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: intentionalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );

                        expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
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

                        expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );

                        expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    // Add a delay. In iOS, the position is *not* reached instantly, needs a timeout
                    afterScreenUpdate( function () {

                        $window.scrollTo( "right" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );

                            expect( $window.scrollLeft() ).toBeLocatedCloselyRightOf( userTarget.x, abortTolerance, borderFuzziness );
                            expect( $window.scrollLeft() ).toBeLocatedStrictlyLeftOf( maxScrollWidth );
                            done();
                        } );

                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold && !isIOS(), isIOS() ? msgTestSkippedUnreliableIOS : msgTestSkippedNoThreshold, 'Movement does not stop', function () {

                it( 'when the user scrolls horizontally, in the same direction, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "right" );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toEqual( 0 );
                        expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
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
                        expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    // Add a delay. In iOS, the position is *not* reached instantly, needs a timeout
                    afterScreenUpdate( function () {

                        $window.scrollTo( "right" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toFuzzyEqual( maxScrollWidth );
                            done();
                        } );

                    } );
                } );

            } );

        } );

        describe( 'Scrolling horizontally, to the left.', function () {

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

                        expect( $window.scrollLeft() ).toBeLocatedCloselyLeftOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyRightOf( 0 );
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

                        expect( $window.scrollLeft() ).toBeLocatedCloselyLeftOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyRightOf( 0 );
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
                        expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );

                        expect( $window.scrollLeft() ).toBeLocatedCloselyLeftOf( userTarget.x, abortTolerance, borderFuzziness );
                        expect( $window.scrollLeft() ).toBeLocatedStrictlyRightOf( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, in mid movement', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    // Add a delay. In iOS, the position is *not* reached instantly, needs a timeout
                    afterScreenUpdate( function () {

                        $window.scrollTo( "left" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( -intentionalUserScrollMovement, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );

                            expect( $window.scrollLeft() ).toBeLocatedCloselyLeftOf( userTarget.x, abortTolerance, borderFuzziness );
                            expect( $window.scrollLeft() ).toBeLocatedStrictlyRightOf( 0 );
                            done();
                        } );

                    } );
                } );

            } );

            describeIf( hasUserScrollThreshold && !isIOS(), isIOS() ? msgTestSkippedUnreliableIOS : msgTestSkippedNoThreshold, 'Movement does not stop', function () {

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
                        expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls vertically, upwards, but only by as much as the threshold', function ( done ) {
                    var userTarget;
                    $window.scrollTop( 100 );

                    // Add a delay. In iOS, the position is *not* reached instantly, needs a timeout
                    afterScreenUpdate( function () {

                        $window.scrollTo( "left" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( -accidentalUserScrollMovement, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( userTarget.y );
                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );

                    } );
                } );

            } );

        } );

        describeIf( userScrollDetectionEnabled && hasUserScrollThreshold, userScrollDetectionEnabled ? msgTestSkippedNoThreshold : msgTestSkippedDetectionDisabled, 'Cumulative scrolling.', function () {

            describe( 'The user scrolls as much as the threshold at first, and just enough to be detectable later. The scroll movement stops the second time', function () {

                // An internal setting controls how much the user needs to scroll in order to be detected. The user has
                // to scroll more than the number of pixels specified in $.scrollable._scrollDetectionThreshold.

                var detectableMinimum;

                beforeEach( function () {
                    detectableMinimum = $.scrollable._scrollDetectionThreshold + 1;
                } );

                it( 'when the user scrolls on the same axis as the animation', function ( done ) {
                    var userTarget1, userTarget2;
                    $window.scrollTo( "bottom" );

                    earlyInMidScroll( function () {
                        userTarget1 = userScrollsBy( accidentalUserScrollMovement, $window );
                    } );

                    inMidScroll( function () {
                        userTarget2 = userScrollsBy( detectableMinimum, $window );
                    } );

                    afterScroll( function () {
                        // earlyInMidScroll runs after 10% of total time, inMidScroll after 50%. Because movement is not
                        // supposed to be halted the first time around, expect the position to have covered at least 40%
                        // (should actually be 50%) of total scrolling distance when the user scrolls for the second
                        // time.
                        expect( userTarget2.y ).toBeGreaterThan( maxScrollHeight * 0.4 );

                        // Verify that the movement stops after the second time.
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget2.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

                it( 'when the user scrolls on a different axis than the animation', function ( done ) {
                    var userTarget1, userTarget2;
                    $window.scrollTo( "bottom" );

                    earlyInMidScroll( function () {
                        userTarget1 = userScrollsBy( { x: accidentalUserScrollMovement }, $window );
                    } );

                    inMidScroll( function () {
                        userTarget2 = userScrollsBy( { x: detectableMinimum }, $window );
                    } );

                    afterScroll( function () {
                        // Again, expect the position to have covered at least 40% of total scrolling distance when the
                        // user scrolls for the second time. See the test above.
                        expect( userTarget2.y ).toBeGreaterThan( maxScrollHeight * 0.4 );

                        // Verify that the movement stops after the second time.
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget2.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget2.x );
                        done();
                    } );
                } );

            } );
        } );

        describe( 'Clearing the queue.', function () {

            describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'When the user scrolls while some scroll animations are still waiting in the queue,', function () {
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
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                    } );

                    afterScrolls( 4, done );
                } );

                it( 'the queued animations are removed as well', function ( done ) {
                    afterScrolls( 4, function () {
                        expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                        expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                        expect( $window.scrollLeft() ).toFuzzyEqual( userTarget.x );
                        done();
                    } );
                } );

            } );
        } );

        describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Callbacks.', function () {

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

            describe( 'For an animation which is aborted due to user scrolling,', function () {

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
                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedStrictlyAbove( maxScrollHeight );
                } );

                it( 'the fail callback runs', function () {
                    expect( callbacks_1.fail ).toHaveBeenCalled();
                    expect( callbackCalls_1.fail.callCount ).toEqual( 1 );
                    expect( callbackCalls_1.fail.scrollState.x ).toFuzzyEqual( userTarget.x );
                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                    expect( callbackCalls_1.always.scrollState.y ).toBeLocatedStrictlyAbove( maxScrollHeight );
                } );

            } );

            describe( 'For an animation which is removed from the queue due to user scrolling,', function () {

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

        describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Changing the userScrollThreshold.', function () {

            describe( 'Changing the global value.', function () {
                var defaultThreshold, detectableMinimum;

                beforeEach( function () {
                    defaultThreshold = $.scrollable.userScrollThreshold;
                    detectableMinimum = $.scrollable._scrollDetectionThreshold + 1;
                } );

                afterEach( function () {
                    $.scrollable.userScrollThreshold = defaultThreshold;
                } );

                describe( 'The threshold is reduced to ' + $.scrollable._scrollDetectionThreshold + ' (minimum value).', function () {

                    beforeEach( function () {
                        $.scrollable.userScrollThreshold = $.scrollable._scrollDetectionThreshold;
                    } );

                    it( 'When the user scrolls just enough to be detectable (' + ( $.scrollable._scrollDetectionThreshold + 1 ) + 'px), the scroll animation is stopped', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( detectableMinimum, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                            expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is increased to 100.', function () {

                    beforeEach( function () {
                        $.scrollable.userScrollThreshold = 100;
                    } );

                    it( 'When the user scrolls by 100px, the scroll animation continues', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom" );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 100, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
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
                            expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                            expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is reduced to less than the minimum value of ' + $.scrollable._scrollDetectionThreshold + '.', function () {

                    it( 'Calling scrollTo() throws an error', function () {
                        $.scrollable.userScrollThreshold = $.scrollable._scrollDetectionThreshold - 1;
                        expect( function () { $window.scrollTo( 100 ); } ).toThrowError( /^User scroll detection: threshold too low/ );
                    } );
                } );

            } );

            describe( 'Using the userScrollThreshold option.', function () {
                var detectableMinimum;

                beforeEach( function () {
                    detectableMinimum = $.scrollable._scrollDetectionThreshold + 1;
                } );

                describe( 'The threshold is reduced to ' + $.scrollable._scrollDetectionThreshold + ' (minimum value).', function () {

                    it( 'When the user scrolls just enough to be detectable (' + ( $.scrollable._scrollDetectionThreshold + 1 ) + 'px), the scroll animation is stopped', function ( done ) {
                        var userTarget,
                            minimumThreshold = $.scrollable._scrollDetectionThreshold;

                        $window.scrollTo( "bottom", { userScrollThreshold: minimumThreshold } );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( detectableMinimum, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                            expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is increased to 100.', function () {

                    it( 'When the user scrolls by 100px, the scroll animation continues', function ( done ) {
                        var userTarget;
                        $window.scrollTo( "bottom", { userScrollThreshold: 100 } );

                        inMidScroll( function () {
                            userTarget = userScrollsBy( 100, $window );
                        } );

                        afterScroll( function () {
                            expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
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
                            expect( $window.scrollTop() ).toBeLocatedCloselyBelow( userTarget.y, abortTolerance, borderFuzziness );
                            expect( $window.scrollTop() ).toBeLocatedStrictlyAbove( maxScrollHeight );

                            expect( $window.scrollLeft() ).toEqual( 0 );
                            done();
                        } );
                    } );

                } );

                describe( 'The threshold is reduced to less than the minimum value of ' + $.scrollable._scrollDetectionThreshold + '.', function () {

                    it( 'Calling scrollTo() throws an error', function () {
                        var threshold = $.scrollable._scrollDetectionThreshold - 1;
                        expect( function () { $window.scrollTo( 100, { userScrollThreshold: threshold } ); } ).toThrowError( /^User scroll detection: threshold too low/ );
                    } );

                } );

            } );
        } );

        describeIf( userScrollDetectionEnabled, msgTestSkippedDetectionDisabled, 'Ignoring user scrolling with the ignoreUser option.', function () {

            describe( 'Setting the ignoreUser option to true', function () {

                it( 'When the user scrolls, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: true } );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "scroll"', function () {

                it( 'When the user scrolls, the scroll animation continues regardless', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "scroll" } );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
                    } );

                    afterScroll( function () {
                        expect( $window.scrollTop() ).toFuzzyEqual( maxScrollHeight );
                        expect( $window.scrollLeft() ).toEqual( 0 );
                        done();
                    } );
                } );

            } );

            describe( 'Setting the ignoreUser option to "click"', function () {

                it( 'When the user scrolls, the scroll animation is stopped as usual', function ( done ) {
                    var userTarget;
                    $window.scrollTo( "bottom", { ignoreUser: "click" } );

                    inMidScroll( function () {
                        userTarget = userScrollsBy( intentionalUserScrollMovement, $window );
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