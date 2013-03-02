'use strict';

function RootController($scope, $rootScope, Languages, Profile, User, Url) {
    $scope.url = Url;
    $scope.languages = Languages.list();

    $scope.icons = {
        python: "icon-prog-python",
        javascript: "icon-prog-nodejs02",
        php: "icon-prog-php02",
        csharp: "icon-prog-csharp",
        java: "icon-prog-java",
        haskell: "icon-prog-haskell",
        perl: "icon-prog-perl",
        ruby: "icon-prog-ruby",
        go: "icon-prog-golang02"
    };

    $scope.logout = function() {
        User.logout().success(function() {
            $scope.user = null;
        });
    };

    $rootScope.$on("$routeChangeStart", function(event, next, current) {
        $scope.routeLoading = true;
        $scope.routeError = null;
        updateUser();
    });

    $rootScope.$on("$routeChangeSuccess", function(event, current, previous) {
        //console.log("Route change success");
        $scope.routeLoading = false;
    });

    $rootScope.$on("$routeChangeError", function(event, current, previous, rejection) {
        //console.log("route failed");
        //console.log(rejection);
        //console.log("Route change failed");
        $scope.routeLoading = false;
        $scope.routeError = rejection;
    });

    function updateUser() {
        // Note to self:
        // Dont assign promise to $scope.user, will cause flickering
        // and problems in /profile
        Profile.get().success(function(data) {
            $scope.user = data;
        });
    }
}
