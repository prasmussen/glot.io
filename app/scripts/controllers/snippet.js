'use strict';

SnippetController.resolve = {
    snippet: function($route, Snippets) {
        return Snippets.get($route.current.params.id);
    },

    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    },

    dbInfo: function(Couch) {
        return Couch.db("api").info();
    }
};

function SnippetController($scope, $routeParams, $location, Utils, Segue, Snippets, Runs, Url, snippet, settings, dbInfo) {
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

    // Fetch run result for this code if it exists
    $scope.result = Runs.resultByCode(language, snippet.code);

    $scope.fork = function(code) {
        // Add code to segue and redirect to the compose view
        Segue.setData(code);
        $location.path(Url._composeSnippet(language));
    };

    $scope.run = function(code) {
        $scope.result = {stdout: "Running..."};

        // Check if result already exists in the database
        var r = Runs.resultByCode(language, code);

        // Result was found
        r.success(function(result) {
            $scope.result = result;
        });

        // Result was not found, lets create a run request
        r.error(function() {
            Runs.create(language, code)
                .success(waitForResult);
        });
    };

    $scope.save = function(name, code) {
        Snippets.update(snippet._id, language, name, code)
            .success(saveSuccess)
            .error(saveError);
    };

    function waitForResult(doc) {
        Runs.onResult(doc._id, dbInfo.update_seq, function(doc) {
            $scope.result = doc.result;
        });
    }

    function saveSuccess(data) {
        alertify.success("Snippet saved");
    }

    function saveError(data) {
        alertify.error(data.reason);
    }
}
