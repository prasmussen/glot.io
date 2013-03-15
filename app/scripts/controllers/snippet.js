'use strict';

SnippetController.resolve = {
    snippet: function($route, Snippets) {
        return Snippets.get($route.current.params.id);
    },

    results: function($route, Runs) {
        return Runs.resultsBySnippet($route.current.params.id);
    },

    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    },

    dbInfo: function(Couch) {
        return Couch.db("api").info();
    }
};

function SnippetController($scope, $routeParams, $location, Utils, Segue, Snippets, Runs, Url, snippet, results, settings, dbInfo) {
    var language = $routeParams.lang;

    $scope.result = results.filter(function(res) {
        return res.code === snippet.code.trimRight() && res.hasOwnProperty("result");
    }).map(function(res) {
        return res.result;
    })[0];

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
        $scope.result = {stdout: "Running..."};
        Runs.create(language, code.trimRight(), snippet._id)
            .success(waitForResult);
    };

    $scope.save = function(name, code) {
        Snippets.update(snippet._id, language, name, code.trimRight())
            .success(saveSuccess)
            .error(saveError);
    };

    function waitForResult(doc) {
        Runs.onResult(doc._id, dbInfo.update_seq, function(doc) {
            $scope.result = doc.result;
        });
    }

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
