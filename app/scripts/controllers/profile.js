'use strict';

function ProfileController($scope, $route, $timeout, User, Profile) {
    $scope.save = function(user) {
        Profile.save(user.name, user._id, user._rev)
            .success(saveSuccess)
            .error(error);
    };

    $scope.resetPassword = function(password, user) {
        // Set new password
        User.setPassword(user._id, password)
            .error(error)
            .success(function() {
                // Authenticate user with new password
                User.authenticate(user._id, password)
                    .then(resetSuccess);
            });
    };

    function saveSuccess(data) {
        $scope.alert = {
            type: "success",
            msg: "Save successful"
        };
    }

    function resetSuccess() {
        $scope.alert = {
            type: "success",
            msg: "Password updated, reloading..."
        };

        // Reload route after 2 seconds, to update state
        $timeout($route.reload, 1500);
    }

    function error(data) {
        $scope.alert = {
            type: "error",
            msg: data.reason
        };
    }
}
