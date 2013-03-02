'use strict';

AuthorController.resolve = {
    // Inject list of snippets by selected author
    snippets: function($route, Snippets) {
        return Snippets.byAuthor($route.current.params.id);
    },

    // Inject authors profile
    profile: function($route, Profile) {
        return Profile.byAuthor($route.current.params.id);
    }
};

function AuthorController($scope, $routeParams, snippets, profile) {
    $scope.profile = profile;
    $scope.snippets = snippets;
}
