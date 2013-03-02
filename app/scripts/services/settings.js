'use strict';

angular.module('glotApp').factory('Settings', function(Couch, Response) {
    return {
        // Get settings for given language
        byLanguage: function(id) {
            var req = Couch.db("api").view("settings", "by_language", id);
            var r = Response.rejectZeroRows(req);
            return Response.toObject(r);
        }
    };
});
