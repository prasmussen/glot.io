'use strict';

// Service used to save and retreive runs from the database
angular.module('glotApp').factory('Runs', function(Couch, Response) {
    return {
        // Get result by language and code
        resultByCode: function(language, code) {
            code = code.trim();
            var key = [language, CryptoJS.SHA1(code).toString()];
            var req = Couch.db("api").view("runs", "result_by_codehash", {key: key, limit: 1});

            // Reject response with zero rows
            var r = Response.rejectZeroRows(req);

            // Return only result value
            return Response.getValue(r, "result");
        },

        // Create a run request document
        create: function(language, code) {
            code = code.trim();

            return Couch.db("api").updateHandler("app", "run", null, {
                language: language,
                code: code,
                codehash: CryptoJS.SHA1(code).toString()
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
