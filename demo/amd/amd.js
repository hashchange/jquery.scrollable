requirejs.config( {

    baseUrl: '../../bower_components',

    paths: {
        'jquery': '../demo/bower_demo_components/jquery/dist/jquery',
        'jquery.documentsize': '/bower_components/jquery.documentsize/dist/amd/jquery.documentsize',
        'jquery.scrollable': '/dist/amd/jquery.scrollable',
        'underscore': '../demo/bower_demo_components/underscore/underscore'
    },

    shim: {
        'underscore': {
            exports: '_'
        }
    }

} );

require( [

    'jquery',
    'underscore',
    'jquery.scrollable'

], function ( $, _ ) {

    $( function () {

        var $window = $( window ),
            $body = $( document.body ),

            $controlsPane = $( ".scroll-controls" ),
            $modeControls = $( "a.mode", $controlsPane ),
            $movementControls = $( "a.shift, a.jump", $controlsPane ),

            $feedbackPane = $( ".feedback" ),
            $feedbackX_px = $( ".x-px", $feedbackPane ),
            $feedbackX_percent = $( ".x-percent", $feedbackPane ),
            $feedbackY_px = $( ".y-px", $feedbackPane ),
            $feedbackY_percent = $( ".y-percent", $feedbackPane ),

            $log = $( "#log", $feedbackPane );

        // Make sure the document body is larger than the window by at least 2000px in each dimension
        $body
            .css( {
                minWidth:  ( $.windowWidth() + 2000 ) + "px",
                minHeight: ( $.windowHeight() + 2000 ) + "px"
            } );

        // Add a gradient background by injecting a "gradient background div". This is a terrible hack.
        //
        // Setting the gradient directly on the body didn't work as intended. The gradient just extended across the
        // screen, not across the full body size. Beyond the screen, the gradient was repeated, creating a pattern. Body
        // somehow seems to be confused with "window". Observed in Chrome 43 (May 2015).
        //
        // (Adding the gradient class after setting the final body size didn't change this, either.)
        $( "<div/>" ).appendTo( $body ).addClass( "maxed gradient" );

        // Hide the info header, show controls
        $( "#header" ).delay( 2000 ).fadeOut( 800, function () {
            $controlsPane.show();
        } );

        $movementControls.click( function ( event ) {
            var chain,
                $elem = $( this ),
                chainData = $elem.data( "chain" ),
                scrollMode = chainData ? "append" : getScrollMode(),
                actionLabel = $elem.text(),

                config = {
                    duration: 2000,
                    append: scrollMode === "append",
                    merge: scrollMode === "merge",
                    done: function () {
                        updateLog( actionLabel + " done.", true );
                    }
                };

            event.preventDefault();

            if ( chainData ) {

                chain = chainData.split( "|" );
                chain = $.map( chain, function ( stepData ) {
                    var coords = stepData.split( "," );
                    return { x: coords[0], y: coords[1] };
                } );

                $.each( chain, function ( index, position ) {
                    config.done = function () {
                        var isLastSubscroll = index === chain.length - 1;
                        updateLog( [ actionLabel, " (", index + 1, ") done for { x: ", position.x, ", y: ", position.y, " }." ], isLastSubscroll );
                    };

                    $window.scrollTo( position, config );
                } );

            } else {

                $window.scrollTo( {
                    x: $elem.data( "x" ),
                    y: $elem.data( "y" )
                }, config );

            }

        } );

        $modeControls.click( function ( event ) {
            var $elem = $ ( this );

            event.preventDefault();
            $modeControls.not( $elem ).removeClass( "active" ).addClass( "info" );
            $elem.addClass( "active" ).removeClass( "info" );
        } );

        $modeControls.filter( ".default" ).click();

        $window.scroll( _.throttle( updateFeedback, 100 ) );
        updateFeedback();

        function updateFeedback () {
            var posX = $window.scrollLeft(),
                posY = $window.scrollTop(),
                range = $window.scrollRange();

            $feedbackX_px.text( posX + "px" );
            $feedbackX_percent.text( toPercent( posX, range.horizontal, 4 ) + "%" );

            $feedbackY_px.text( posY + "px" );
            $feedbackY_percent.text( toPercent( posY, range.vertical, 4 ) + "%" );
        }

        function updateLog ( message, addSeparator ) {
            var $entry = $( "<li/>" );

            if ( $.isArray( message ) ) message = message.join( "" );

            if ( addSeparator ) $entry.addClass( "done" );
            $entry.text( message ).appendTo( $log );

            console.log( message );
            if ( addSeparator ) console.log( "-------" );
        }

        function getScrollMode () {
            return $modeControls.filter( ".active" ).data( "mode" );
        }

    } );

    function toPercent ( pos, scrollRange, decimals ) {
        var percentage = pos * 100 / scrollRange,
            shift = Math.pow( 10, decimals || 0 );

        return Math.round( percentage * shift ) / shift;
    }

} );
