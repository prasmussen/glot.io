'use strict';

ComposeController.resolve = {
    // Inject language settings
    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    }
};

function ComposeController($scope, $routeParams, $location, Snippets, Utils, Segue, Url, settings) {
    var language = $routeParams.lang;
    $scope.language = language;

    // Set codemirror options
    $scope.options = {
        lineNumbers: true,
        indentUnit: 4,
        tabMode: "shift",
        mode: settings.mode,
    };

    // Segue has data if we transitioned from a fork action
    if (Segue.hasData()) {
        // Fill editor with forked code
        $scope.code = Segue.getData();
    } else {
        // Fill editor with 10 empty lines
        $scope.code = Utils.ensureMinLines("", 10);
    }

    $scope.save = function(name, code) {
        Snippets.create(language, name, code.trimRight())
            .success(saveSuccess)
            .error(saveError);
    };

    function saveSuccess(data) {
        // Redirect to snippet view
        $location.path(Url._editSnippet(language, data._id));
    }

    function saveError(data) {
        console.log("error");
        console.log(data);
    }
}
