'use strict';

// Service used to save and retreive snippets from the database
angular.module('glotApp').factory('Snippets', function(Couch, Response) {
    return {
        // Get snippet by id
        get: function(id) {
            var req = Couch.db("api").get(id);
            return Response.toObject(req);
        },

        // Get snippet by author
        byAuthor: function(author) {
            var req = Couch.db("api").view("snippets", "by_author", {key: author});
            return Response.toArray(req);
        },

        // Create new snippet
        create: function(language, name, code) {
            return Couch.db("api").updateHandler("app", "snippet", null, {
                language: language,
                name: name,
                code: code.trim()
            });
        },

        // Update existing snippet
        update: function(id, language, name, code) {
            return Couch.db("api").updateHandler("app", "snippet", id, {
                language: language,
                name: name,
                code: code.trim()
            });
        }
    };
});
