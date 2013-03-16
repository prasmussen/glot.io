'use strict';

// Service that provides helper functions to extract the
// relevant data from a couchdb response
angular.module('glotApp').factory('Response', function($q, Utils) {
    // Applies a transform function on the data object on a success response
    function dataTransform(req, transformer) {
        var deferred = $q.defer();

        req.success(function(data, status, headers, config) {
            var transformed = transformer(data);
            deferred.resolve(transformed, status, headers, config);
        });

        req.error(deferred.reject);

        return Utils.successErrorPromise(deferred);
    }

    function getValueTransform(attr) {
        return function(data) {
            var obj = toObjectTransform(data)
            return (obj && obj.hasOwnProperty(attr)) ? obj[attr] : null;
        };
    }

    function toArrayTransform(data) {
        return data.rows.map(function(row) {
            return row.value;
        });
    }

    function toObjectTransform(data) {
        if (data.rows) {
            var arr = toArrayTransform(data);
            return arr[0];
        } else {
            return data;
        }
    }

    // Reject repsonses that has 0 rows
    function rejectZeroRows(req) {
        var deferred = $q.defer();

        req.success(function(data, status, headers, config) {
            if (data && data.rows && data.rows.length === 0) {
                deferred.reject({
                    error: "not_found",
                    reason: "Response contains no rows"
                });
            } else {
                deferred.resolve(data, status, headers, config);
            }
        });

        req.error(deferred.reject);

        return Utils.successErrorPromise(deferred);
    }

    return {
        // Transforms the success data of a $http request,
        // into a single normalized js object
        toObject: function(req) {
            return dataTransform(req, toObjectTransform);
        },

        // Transforms the success data of a $http request,
        // into a normalized js array
        toArray: function(req) {
            return dataTransform(req, toArrayTransform);
        },

        // Transforms the success data of a $http request,
        // into a single normalized js value
        getValue: function(req, attr) {
            var transform = getValueTransform(attr);
            return dataTransform(req, transform);
        },

        rejectZeroRows: function(req) {
            return rejectZeroRows(req);
        }
    };
});
