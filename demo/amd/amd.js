requirejs.config( {

    baseUrl: '../../bower_components',

    paths: {
        'jquery': '../demo/bower_demo_components/jquery/dist/jquery',
        'jquery.documentsize': '/bower_components/jquery.documentsize/dist/amd/jquery.documentsize',
        'jquery.scrollable': '/dist/amd/jquery.scrollable'
    }

} );

require( [

    'jquery',
    'jquery.scrollable'

], function ( $ ) {

    $( function () {

        var $window = $( window );
        $window.scrollTo( 100 );

    } );

} );
