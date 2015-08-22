requirejs.config( {

    baseUrl: '../../bower_components',

    paths: {
        'jquery': '../demo/bower_demo_components/jquery/dist/jquery',
        'jquery.documentsize': '/bower_components/jquery.documentsize/dist/amd/jquery.documentsize',
        'jquery.scrollable': '/dist/amd/jquery.scrollable',
        'underscore': '../demo/bower_demo_components/underscore/underscore',
        'usertiming': '../demo/bower_demo_components/usertiming/src/usertiming'
    },

    shim: {
        'underscore': {
            exports: '_'
        }
    }

} );
