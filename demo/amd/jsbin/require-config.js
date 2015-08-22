requirejs.config( {

    paths: {
        'jquery': 'https://code.jquery.com/jquery-1.11.3',
        'jquery.documentsize': 'https://cdn.rawgit.com/hashchange/jquery.documentsize/1.2.1/dist/amd/jquery.documentsize',
        'jquery.scrollable': 'https://cdn.rawgit.com/hashchange/jquery.scrollable/1.1.1/dist/amd/jquery.scrollable',
        'underscore': 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore',
        'usertiming': 'https://cdn.rawgit.com/nicjansma/usertiming.js/v0.1.6/src/usertiming'
    },

    shim: {
        'underscore': {
            exports: '_'
        }
    }

} );
