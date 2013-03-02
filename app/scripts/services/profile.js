'use strict';

// Service for creating and retrieving user profiles
angular.module('glotApp').factory('Profile', function($q, Utils, Couch, Response) {
    // Helper function to request the profile
    function requestProfile(authorId, deferred) {
        var req = Couch.db("api").get(authorId);

        req.success(deferred.resolve);

        req.error(function(data, status, headers, config) {
            if (status === 404) {
                // The profile was not found for some reason,
                // a profile is created at signup for every user,
                // but somehow this user does not have a profile.
                // Lets resolve the deferred with a minimal profile
                // with the author id as name
                deferred.resolve({
                    _id: authorId,
                    name: authorId
                });
            } else {
                // Something very wrong must have happend at this point,
                // lets reject the deferred
                deferred.reject(data, status, headers, config);
            }
        });
    }

    // Retrieve profile
    // To id of the user's profile document is the same as the
    // userCtx.name from the _session object. We must first
    // request the _session object to able to find the profile document
    // An empty object will be returned if the user is not logged in
    function getProfile() {
        var deferred = $q.defer();

        // Request user session first
        var req = Couch.session();

        req.success(function(data) {
            // We were able to get the session information
            // Check if we are logged in
            if (data.userCtx.name) {
                // We are logged in!
                // Lets request the profile document which has the
                // same id as the user name
                requestProfile(data.userCtx.name, deferred);
            } else {
                // We are not logged in
                // Lets just return an empty object
                deferred.resolve({});
            }
        });

        // Reject if we are not able to get the session object
        req.error(deferred.reject);

        return Utils.successErrorPromise(deferred);
    }

    return {
        // Get profile by author id
        byAuthor: function(id) {
            var req = Couch.db("api").get(id);
            return Response.toObject(req);
        },

        get: function() {
            return getProfile();
        },

        // Create new user profile
        save: function(name, authorId, rev) {
            return Couch.db("api").save(authorId, {
                type: "profile",
                name: name,
                _rev: rev
            });
        }
    };
});
