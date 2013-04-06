'use strict';

angular.module('glotApp').factory('Examples', function(Couch, Response) {
    return {
        // Get all examples for given language
        byLanguage: function(id) {
            var req = Couch.db("api").view("examples", "by_language", {key: id});
            return Response.toArray(req);
        },

        byName: function(language, name) {
            var req = Couch.db("api").view("examples", "by_name", {key: [language, name]});
            return Response.toObject(req);
        }
    };
});
