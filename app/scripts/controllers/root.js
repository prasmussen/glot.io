'use strict';

function RootController($scope, $rootScope, $location, Languages, Profile, User, Url) {
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
        go: "icon-prog-golang02",
        erlang: "icon-prog-erlang",
        c: "icon-prog-c",
        cpp: "icon-prog-cplusplus",
        clojure: "icon-pl-clojure",
        scala: "icon-prog-scala",
        bash: "icon-prog-bash02"
    };

    $scope.logout = function() {
        User.logout().success(function() {
            $scope.user = null;
            // Redirect to login view
            $location.path(Url._login());
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
