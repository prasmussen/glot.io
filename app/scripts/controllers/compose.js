'use strict';

ComposeController.resolve = {
    // Inject language settings
    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    },

    dbInfo: function(Couch) {
        return Couch.db("api").info();
    }
};

function ComposeController($scope, $routeParams, $location, Snippets, Runs, Utils, Segue, Url, settings, dbInfo) {
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
        Snippets.create(language, name, code.trimRight())
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
        // Redirect to snippet view
        $location.path(Url._editSnippet(language, data._id));
    }

    function saveError(data) {
        alertify.error(data.reason);
    }
}
