'use strict';

angular.module('glotApp').factory('Utils', function() {
    return {
        ensureMinLines: function(text, min) {
            var count = text.split("\n").length;
            for (var i = count; i < min; i++) {
                text += "\n";
            }
            return text;
        },

        // Create a promise with a success and error method,
        // making it compatible with $http promises
        successErrorPromise: function(deferred) {
            var promise = deferred.promise;

            promise.success = function(callback) {
                promise.then(callback);
                return promise;
            };

            promise.error = function(callback) {
                promise.then(null, callback);
                return promise;
            };

            return promise;
        }
    };
});
