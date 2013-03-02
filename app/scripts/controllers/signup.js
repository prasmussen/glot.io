'use strict';

function SignupController($scope, $location, User, Url) {
    $scope.signUp = function(email, password) {
        var id = CryptoJS.SHA1(email).toString();

        // Create user
        User.create(id, email, password).error(error).success(function() {
            // Authenticate user
            User.authenticate(id, password).success(function() {
                // Redirect user
                $location.path(Url._profile());
            });
        });
    };

    function error(data) {
        $scope.alert = {
            type: 'error',
            msg: data.reason
        };
    }
}
