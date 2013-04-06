'use strict';

function ProfileController($scope, $route, $timeout, User, Profile) {
    $scope.save = function(user) {
        var r = Profile.save(user.name, user._id, user._rev);

        r.success(function(data) {
            // Update document revision
            user._rev = data.rev;
            alertify.success("Save successful");
        });

        r.error(error);
    };

    $scope.resetPassword = function(password, user) {
        var id = user._id;
        var hashedPassword = CryptoJS.SHA1(password + id).toString();

        // Set new password
        User.setPassword(id, hashedPassword)
            .error(error)
            .success(function() {
                // Authenticate user with new password
                User.authenticate(id, hashedPassword)
                    .then(resetSuccess);
            });
    };

    function resetSuccess() {
        alertify.success("Password updated");

        // Reload route
        $route.reload();
    }

    function error(data) {
        alertify.error(data.reason);
    }
}
