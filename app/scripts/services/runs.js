'use strict';

// Service used to save and retreive runs from the database
angular.module('glotApp').factory('Runs', function(Couch, Response) {
    return {
        // Get runs for the given snippetId
        resultsBySnippet: function(snippetId) {
            var req = Couch.db("api").view("runs", "results_by_snippet", snippetId);
            return Response.toArray(req);
        },

        // Get runs by hash
        byLanguageCode: function(language, code) {
            var key = [language, CryptoJS.SHA1(code).toString()];
            var req = Couch.db("api").view("runs", "by_codehash", key);
            return Response.toArray(req);
        },

        // Create a run request document
        create: function(language, code, snippetId) {
             return Couch.db("api").updateHandler("app", "run", null, {
                language: language,
                code: code,
                codehash: CryptoJS.SHA1(code).toString(),
                snippet: snippetId,
            });
        },

        onResult: function(id, since, callback) {
            var feed = Couch.db("api").changes({
                since: since,
                include_docs: true,
                filter: "app/run_result",
                query_params: {id: id}
            });

            feed.onChange(function(change) {
                if (change.results.length === 0) {
                    return;
                }

                var doc = change.results.map(function(res) {
                    return res.doc;
                }).filter(function(doc) {
                    return doc.hasOwnProperty("result");
                })[0];

                if (doc) {
                    feed.stop();
                    callback(doc);
                }
            });
        }
    };
});
