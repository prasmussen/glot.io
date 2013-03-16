'use strict';

angular.module('glotApp').factory('Languages', function(Response, Couch) {
    return {
        // Get language by id
        get: function(id) {
            var req = Couch.db("api").get(id);
            return Response.toObject(req);
        },

        // Get list of all languages
        list: function() {
            var req = Couch.db("api").view("languages", "list");
            return Response.toArray(req);
        }
    };
});
