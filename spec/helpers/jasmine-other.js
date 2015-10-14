/**
 * More custom matchers for Jasmine.
 */

if ( ! jasmine._addTheseCustomMatchers ) jasmine._addTheseCustomMatchers = {};

/**
 * Tests if a given position (integer or float) is located closely below/to the right of another one. or equal to it.
 * The acceptable tolerance, in pixels, must be passed to the matcher as the second argument.
 *
 * Designed to make reasonably sure the position is within the desired zone, without being tricked by sub-pixel
 * differences in Android, or by 1px deviations (also in Android), which would make the match fail for no reason.
 *
 * - Requires a `tolerance` argument. That is the amount of pixels which is still considered "close" to the target in
 *   "closelyBelow", "closelyAbove" etc. That kind of precision or tolerance defines the essence of the actual test, and
 *   it must be specified.
 *
 * - Optionally, the test adds tolerance to the other side of the target as well (called borderFuzziness here). So a
 *   value which is expected to be below the target can actually be above it by a little bit. Again, this is to deal
 *   with Android errors. By default, that tolerance is 0.
 *
 * - Adds a little extra tolerance, aka fuzziness, by treating decimal differences very generously.
 */
jasmine._addTheseCustomMatchers.toBeLocatedCloselyBelow =
jasmine._addTheseCustomMatchers.toBeLocatedCloselyRightOf = function () {

    function compare ( actual, expected, tolerance, borderFuzziness ) {
        var result = {},

            actualFloor = Math.floor( actual ),
            actualCeil = Math.ceil( actual ),
            expectedFloor = Math.floor( expected ) - ( borderFuzziness || 0 ),
            expectedCeil = Math.ceil( expected ) + tolerance,

            satisfiesLowerLimit = actualCeil >= expectedFloor,
            satisfiesUpperLimit = actualFloor <= expectedCeil;

        if ( tolerance === undefined ) {
            result.pass = false;
            result.message = "Jasmine matcher: missing second argument, tolerance not defined";
            return result;
        }

        result.pass = satisfiesLowerLimit && satisfiesUpperLimit;

        if ( result.pass ) {

            result.message = "Expected " + actual;

            if ( actual < actualCeil ) result.message += " (rounded up to " + actualCeil + ")";
            result.message += " to be lower than " + expectedFloor + ", or expected it";

            if ( actual > actualFloor ) result.message += " (rounded down to " + actualFloor + ")";
            result.message += " to be greater than " + expectedCeil;

        } else {
            result.message = "Expected " + actual + " to be within range " + expectedFloor + ", " + expectedCeil;
        }
        return result;
    }

    return {
        compare: compare,
        negativeCompare: function ( actual, expected, tolerance ) {
            var result = compare( actual, expected, tolerance );
            result.pass = tolerance === undefined ? false: !result.pass;
            return result;
        }
    }
};

/**
 * Tests if a given position (integer or float) is located closely above/to the left of another one. or equal to it. The
 * acceptable tolerance, in pixels, must be passed to the matcher as the second argument.
 *
 * Designed to make reasonably sure the position is within the desired zone, without being tricked by sub-pixel
 * differences in Android, or by 1px deviations (also in Android), which would make the match fail for no reason.
 *
 * - Requires a `tolerance` argument. That is the amount of pixels which is still considered "close" to the target in
 *   "closelyBelow", "closelyAbove" etc. That kind of precision or tolerance defines the essence of the actual test, and
 *   it must be specified.
 *
 * - Optionally, the test adds tolerance to the other side of the target as well (called borderFuzziness here). So a
 *   value which is expected to be below the target can actually be above it by a little bit. Again, this is to deal
 *   with Android errors. By default, that tolerance is 0.
 *
 * - Adds a little extra tolerance, aka fuzziness, by treating decimal differences very generously.
 */
jasmine._addTheseCustomMatchers.toBeLocatedCloselyAbove =
jasmine._addTheseCustomMatchers.toBeLocatedCloselyLeftOf = function () {

    function compare ( actual, expected, tolerance, borderFuzziness ) {
        var result = {},

            actualFloor = Math.floor( actual ),
            actualCeil = Math.ceil( actual ),
            expectedFloor = Math.floor( expected ) - tolerance,
            expectedCeil = Math.ceil( expected ) + ( borderFuzziness || 0 ),

            satisfiesLowerLimit = actualCeil >= expectedFloor,
            satisfiesUpperLimit = actualFloor <= expectedCeil;

        if ( tolerance === undefined ) {
            result.pass = false;
            result.message = "Jasmine matcher: missing second argument, tolerance not defined";
            return result;
        }

        result.pass = satisfiesLowerLimit && satisfiesUpperLimit;

        if ( result.pass ) {

            result.message = "Expected " + actual;

            if ( actual < actualCeil ) result.message += " (rounded up to " + actualCeil + ")";
            result.message += " to be lower than " + expectedFloor + ", or expected it";

            if ( actual > actualFloor ) result.message += " (rounded down to " + actualFloor + ")";
            result.message += " to be greater than " + expectedCeil;

        } else {
            result.message = "Expected " + actual + " to be within range " + expectedFloor + ", " + expectedCeil;
        }
        return result;
    }

    return {
        compare: compare,
        negativeCompare: function ( actual, expected, tolerance ) {
            var result = compare( actual, expected, tolerance );
            result.pass = tolerance === undefined ? false: !result.pass;
            return result;
        }
    }
};

/**
 * Tests if a given position (integer or float) is located above/to the left of another one.
 *
 * Designed to make sure the position is definitely above the boundary, without being tricked by sub-pixel differences
 * in Android which would hide that the boundary has actually been reached.
 */
jasmine._addTheseCustomMatchers.toBeLocatedStrictlyAbove =
jasmine._addTheseCustomMatchers.toBeLocatedStrictlyLeftOf = function () {
    return {
        compare: function ( actual, expected ) {
            var result = {},
                actualCeil = Math.ceil( actual ),
                expectedFloor = Math.floor( expected );

            result.pass = actualCeil < expectedFloor;
            if ( result.pass ) {
                result.message = "Expected " + actual + " to be at least " + expectedFloor;
            } else {
                result.message = "Expected " + actual;
                if ( actual < actualCeil ) result.message += " (rounded up to " + actualCeil + ")";
                result.message += " to be less than " + expectedFloor;
            }
            return result;
        }
    }
};

/**
 * Tests if a given position (integer or float) is located below/to the right of another one.
 *
 * Designed to make sure the position is definitely below the boundary, without being tricked by sub-pixel differences
 * in Android which would hide that the boundary has actually been reached.
 */
jasmine._addTheseCustomMatchers.toBeLocatedStrictlyBelow =
jasmine._addTheseCustomMatchers.toBeLocatedStrictlyRightOf = function () {
    return {
        compare: function ( actual, expected ) {
            var result = {},
                actualFloor = Math.floor( actual ),
                expectedCeil = Math.ceil( expected );

            expect( actualFloor ).toBeGreaterThan( expectedCeil );

            result.pass = actualFloor > expectedCeil;
            if ( result.pass ) {
                result.message = "Expected " + actual + " to be at most " + expectedCeil;
            } else {
                result.message = "Expected " + actual;
                if ( actual > actualFloor ) result.message += " (rounded down to " + actualFloor + ")";
                result.message += " to be greater than " + expectedCeil;
            }
            return result;
        }
    }
};

/**
 * Similar to toBeCloseTo. Code lifted from there and adjusted.
 *
 * Useful for testing equality roughly, allowing for random sub-pixel differences in Android which would make an exact
 * equality test fail.
 */
jasmine._addTheseCustomMatchers.toFuzzyEqual = function () {
    return {
        compare: function ( actual, expected, precision ) {
            precision || ( precision = 0 );

            return {
                pass: Math.abs( expected - actual ) <= ( Math.pow( 10, -precision ) )
            };
        }
    };
};
