/**
 * Core, option A:
 *
 * The scrollable element for a window is detected with a feature test.
 */

( function ( core, lib ) {
    "use strict";

    /** @type {string}  caches the name of the element to use for window scrolling. Values: "body" or "html" */
    var _windowScrollable;

    /**
     * Returns the scrollable element, in a jQuery wrapper. The container element is expected to be normalized.
     *
     * The return value of the method is determined as follows:
     *
     * - For ordinary elements, it returns the element itself.
     *
     * - For the window, it returns either body or documentElement, depending on the browser whether or not it is in
     *   quirks mode. Document, documentElement and body are considered to mean "window", and are treated the same.
     *
     * - For an iframe element, it returns the scrollable element of the iframe content window.
     *
     * If an empty jQuery set is passed in, an empty jQuery set is returned.
     *
     * @param   {jQuery} $container
     * @returns {jQuery}
     */
     core.getScrollable = function( $container ) {
        return $.isWindow( $container[0] ) ? getWindowScrollable( $container[0] ) : $container;
    };

    /**
     * Animates the scroll movement. Container element and options are expected to be normalized.
     *
     * @param {jQuery} $container
     * @param {number} position
     * @param {Object} options
     */
    core.animateScroll = function ( $container, position, options ) {

        var $scrollable = core.getScrollable( $container );
        lib.addScrollAnimation( $scrollable, position, options );
    };

    /**
     * Core internals
     */

    /**
     * Detects which element to use for scrolling a window (body or documentElement). Returns the element, in a jQuery
     * wrapper.
     *
     * The detection is sandboxed in an iframe created for the purpose.
     *
     * @param {Window} [currentWindow=window]  needed to detect quirks mode in a particular window, and to return the
     *                                         scrollable element in the right window context
     * @returns {jQuery}
     */
    function getWindowScrollable ( currentWindow ) {
        var iframe,
            currentDocument = ( currentWindow || window ).document;

        // In quirks mode, we have to scroll the body, regardless of the normal browser behaviour
        if ( currentDocument.compatMode === "BackCompat" ) return $( currentDocument.body );

        if ( ! _windowScrollable ) {
            iframe = createScrollableTestIframe();

            iframe.contentWindow.scrollTo( 1, 0 );
            _windowScrollable = iframe.contentDocument.documentElement.scrollLeft === 1 ? "html" : "body";

            document.body.removeChild( iframe );
        }

        return _windowScrollable === "html" ? $( currentDocument.documentElement ) : $( currentDocument.body );
    }

    /**
     * Creates an iframe document with an HTML5 doctype and UTF-8 encoding and positions it off screen. Window size
     * is 500px x 500px. Its body is 550px wide, in preparation for a horizontal scroll test. Returns the iframe element.
     *
     * The iframe content has to overflow horizontally, not vertically, because of an iOS quirk. Iframes expand
     * vertically in iOS until the content fits inside (and as a result, we are unable to scroll vertically). But
     * iframes don't expand horizontally, so scrolling on that axis works in iOS.
     *
     * @returns {HTMLIFrameElement}
     */
    function createScrollableTestIframe () {
        var iframe = document.createElement( "iframe" ),
            body = document.body;

        iframe.style.cssText = "position: absolute; top: -600px; left: -600px; width: 500px; height: 500px; margin: 0px; padding: 0px; border: none; display: block;";
        iframe.frameborder = "0";

        body.appendChild( iframe );
        iframe.src = 'about:blank';

        iframe.contentDocument.write( '<!DOCTYPE html><html><head><meta charset="UTF-8"><title></title><style type="text/css">body { width: 550px; height: 1px; }</style></head><body></body></html>' );

        return iframe;
    }

    // Let's prime getWindowScrollable() immediately after the DOM is ready. It is best to do it up front because the
    // test touches the DOM, so let's get it over with before people set up handlers for mutation events and such.
    $( function () {
        if ( _windowScrollable === undefined ) getWindowScrollable();
    } );

} )( core, lib );



