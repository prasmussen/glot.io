'use strict';

SnippetController.resolve = {
    snippet: function($route, Snippets) {
        return Snippets.get($route.current.params.id);
    },

    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    }
};

function SnippetController($scope, $routeParams, $location, Utils, Segue, Snippets, Url, snippet, settings) {
    var language = $routeParams.lang;

    $scope.language = language;

    $scope.options = {
        lineNumbers: true,
        indentUnit: 4,
        tabMode: "shift",
        mode: settings.mode,
    };

    $scope.author = snippet.author;
    $scope.code = Utils.ensureMinLines(snippet.code, 10);
    $scope.name = snippet.name;
    $scope.newName = snippet.name;

    $scope.fork = function(code) {
        Segue.setData(code);
        $location.path(Url._composeSnippet(language));
    };

    $scope.run = function(code) {
       $scope.result = "Run service currently not available.\nTry again later.";
    };

    $scope.save = function(name, code) {
        Snippets.update(snippet._id, language, name, code.trimRight())
            .success(saveSuccess)
            .error(saveError);
    };

    function saveSuccess(data) {
        $scope.alert = {
            type: 'success',
            msg: "Snippet saved"
        };
    }

    function saveError(data) {
        $scope.alert = {
            type: 'error',
            msg: data.reason
        };
    }
}
