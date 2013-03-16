'use strict';

function LoginController($scope, $location, User, Url) {
    $scope.logIn = function(email, password) {
        var id = CryptoJS.SHA1(email).toString();
        User.authenticate(id, password)
            .success(success)
            .error(error);
    };

    function success(data) {
        // Redirect to index view
        $location.path(Url._index());
    }

    function error(data) {
        alertify.error(data.reason);
    }
}
