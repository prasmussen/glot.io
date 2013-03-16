'use strict';

function SignupController($scope, $location, User, Url) {
    $scope.signUp = function(email, password) {
        var id = CryptoJS.SHA1(email).toString();

        // Create user
        User.create(id, email, password).error(error).success(function() {
            // Authenticate user
            User.authenticate(id, password).success(function() {
                // Redirect user to profile view
                $location.path(Url._profile());
            });
        });
    };

    function error(data) {
        alertify.error(data.reason);
    }
}
