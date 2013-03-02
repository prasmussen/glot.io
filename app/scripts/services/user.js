'use strict';

// Service to create couchdb users and retreive session/user details
angular.module('glotApp').factory('User', function($q, Profile, Couch, Utils) {
    function createUserAndProfile(id, email, password) {
        var deferred = $q.defer();

        // Create couchdb user
        var req = Couch.saveUser(id, {
            type: "user",
            name: id,
            password: password,
            roles: [],
            email: email
        });

        // Create profile when user is created
        req.success(function() {
            var re = /^([^@]+)/;
            var m = re.exec(email);
            var name = m[1];
            Profile.save(name, id)
                .success(deferred.resolve)
                .success(deferred.reject);
        });

        // Unable to create user, reject deferred
        req.error(deferred.reject);

        return Utils.successErrorPromise(deferred);
    }

    // Update existing user
    function updateUser(id, user, deferred) {
        return Couch.saveUser(id, user)
            .success(deferred.resolve)
            .error(deferred.reject);
    }

    // Set new password for given user
    // Load the current user object, remove the _id attribute, add the new
    // password as an attribute, and send back the user object
    function setPassword(id, password) {
        var deferred = $q.defer();
        var req = getUser(id);

        req.success(function(user) {
            user.password = password;
            delete user._id;
            updateUser(id, user, deferred);
        });

        req.error(deferred.reject);

        return Utils.successErrorPromise(deferred);
    }

    // Get user object
    function getUser(id) {
       return Couch.getUser(id);
    }

    return {
        // Retreive user object
        get: function(id) {
            return getUser(id);
        },

        // Retreive session information
        session: function() {
            return Couch.session();
        },

        // Authenticate user
        authenticate: function(id, password) {
            return Couch.authenticate(id, password);
        },

        // Create new user
        create: function(id, email, password) {
           // Create couchdb user
           return createUserAndProfile(id, email, password);
        },

        // Set new password
        setPassword: function(userId, password) {
            return setPassword(userId, password);
        },

        // Logout user
        logout: function() {
            return Couch.logout();
        }
    };
});
