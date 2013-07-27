'use strict';

angular.module('glotApp').factory("Couch", function($http, $timeout, Response) {
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

    // Convert a options object to an url query string.
    // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
    function encodeOptions(options) {
        if (typeof(options) !== "object" || options === null) {
            return "";
        }

        var needJsonValue = ["key", "startkey", "endkey"];
        var buf = [];
        for (var name in options) {
            var value = options[name];
            if (needJsonValue.indexOf(name) >= 0 && value !== null) {
                value = JSON.stringify(value);
            }
            buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
        }
        return buf.length ? "?" + buf.join("&") : "";
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

            // Url format: /<dbName>/_design/<designName>/_view/<viewName>[?name=<value>,...]
            view: function(designName, viewName, options) {
                var url = join("_design", designName, "_view", viewName);
                url += encodeOptions(options);
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
            },

            info: function() {
                var url = join();
                var req = $http.get(url);
                return Response.toObject(req);
            },

            // Url format: /<db>/_changes?filter=<designName>/<filterName>&include_docs=true&<queryKey>=<queryValue>
            changes: function(options) {
                var listeners = [];
                var active = true;
                var timeout = 100;

                var promise = {
                    onChange: function(callback) {
                        listeners.push(callback);
                    },

                    stop: function() {
                        active = false;
                    }
                };

                // Call each listener when there is a change
                function triggerListeners(res) {
                    listeners.forEach(function(fn) {
                        fn(res);
                    });
                }

                // TODO: fix url, all options are required atm
                function getChangesSince() {
                    var url = join("_changes");
                    url += "?feed=longpoll&filter=" + options.filter + "&include_docs=" + options.include_docs + "&id=" + options.query_params.id + "&since=" + options.since;
                    $http.get(url).success(changeSuccess).error(changeError);
                }

                function changeSuccess(res) {
                    timeout = 100;
                    if (active) {
                        options.since = res.last_seq;
                        triggerListeners(res)
                        getChangesSince();
                    }
                }

                function changeError(res) {
                    if (active) {
                        $timeout(getChangesSince, timeout);
                        timeout = timeout * 2;
                    }
                }

                if (options.since) {
                    getChangesSince();
                } else {
                    db(dbName).info().success(function(data) {
                        options.since = data.update_seq;
                        getChangesSince();
                    });
                }

                return promise;
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
