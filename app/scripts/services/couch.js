'use strict';

angular.module('glotApp').factory("Couch", function($http) {
    //var PREFIX = "http://dev.glot.io:5984/";
    var PREFIX = "/";

    function urlBuilder(base) {
        return function() {
            var url = base;
            Array.prototype.slice.call(arguments).forEach(function(arg) {
                url += "/" + arg;
            });
            return url;
        };
    }

    function db(dbName) {
        var join = urlBuilder(PREFIX + dbName);

        return {
            get: function(id) {
                var url = join(id);
                return $http.get(url);
            },

            save: function(id, data) {
                var url = join(id);
                return $http.put(url, data);
            },

            // Url format: /<dbName>/_design/<designName>/_view/<viewName>[?key=<key>]
            view: function(designName, viewName, key) {
                var url = join("_design", designName, "_view", viewName);

                // Add query key if given
                if (key) {
                    url += "?key=" + JSON.stringify(key);
                }

                return $http.get(url);
            },

            // Url format: /<dbName>/_design/<designName>/_update/<handlerName>"
            updateHandler: function(designName, handlerName, id, data) {
                var url = join("_design", designName, "_update", handlerName);
                var method;

                if (id) {
                    url += "/" + id;
                    method = $http.put;
                } else {
                    method = $http.post;
                }

                return method(url, data);
            }
        };
    }

    return {
        db: db,

        session: function() {
            return $http.get(PREFIX + "_session");
        },

        authenticate: function(id, password) {
            var data = $.param({name: id, password: password});
            var url = PREFIX + "_session";
            return $http.post(url, data, {
                headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
            });
        },

        logout: function() {
            return $http.delete(PREFIX + "_session");
        },

        // Url format /_users/org.couchdb.user:<id>
        saveUser: function(id, data) {
            var join = urlBuilder(PREFIX + "_users");
            var url = join("org.couchdb.user:" + id);
            return $http.put(url, data);
        },

        getUser: function(id) {
            var join = urlBuilder(PREFIX + "_users");
            var url = join("org.couchdb.user:" + id);
            return $http.get(url);
        }
    };
});
