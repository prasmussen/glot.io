'use strict';

function SignupController($scope, $location, User, Url) {
    $scope.signUp = function(email, password) {
        var id = CryptoJS.SHA1(email).toString();
        var hashedPassword = CryptoJS.SHA1(password + id).toString();

        // Create user
        User.create(id, email, hashedPassword).error(error).success(function() {
            // Authenticate user
            User.authenticate(id, hashedPassword).success(function() {
                // Redirect user to profile view
                $location.path(Url._profile());
            });
        });
    };

    function error(data) {
        alertify.error(data.reason);
    }
}
