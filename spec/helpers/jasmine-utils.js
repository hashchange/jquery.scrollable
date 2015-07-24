/**
 * Custom matchers for Jasmine. Not provided by jasmine-expect (aka jasmine-matchers), either.
 */

// Making sure we have a private object to collect custom matchers in. We attach it to the jasmine namespace because we
// know for sure it is available.
//
// It is best to keep collection and registration separate. Custom matchers are registered with Jasmine in a global
// beforeEach call, which should only happen once. (That is done here: we call the forEach below.) But other components
// still have the chance to jump on the bandwagon and add their own custom matchers, simply by attaching them to the
// collection object.
if ( ! jasmine._addTheseCustomMatchers ) jasmine._addTheseCustomMatchers = {};

jasmine._addTheseCustomMatchers.toBeAtLeast = function ( util, customEqualityTesters ) {
    return {
        compare: function ( actual, expected ) {
            var result = {};
            result.pass = util.equals( actual >= expected, true, customEqualityTesters );
            if ( result.pass ) {
                result.message = "Expected " + actual + " to be less than " + expected;
            } else {
                result.message = "Expected " + actual + " to be at least " + expected;
            }
            return result;
        }
    }
};

jasmine._addTheseCustomMatchers.toBeAtMost = function ( util, customEqualityTesters ) {
    return {
        compare: function ( actual, expected ) {
            var result = {};
            result.pass = util.equals( actual <= expected, true, customEqualityTesters );
            if ( result.pass ) {
                result.message = "Expected " + actual + " to be greater than " + expected;
            } else {
                result.message = "Expected " + actual + " to be at most " + expected;
            }
            return result;
        }
    }
};

beforeEach( function () {

    // When beforeEach is called outside of a `describe` scope, the matchers are available globally.
    // See http://stackoverflow.com/a/11942151/508355

    jasmine.addMatchers( jasmine._addTheseCustomMatchers );

} );
