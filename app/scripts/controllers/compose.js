'use strict';

ComposeController.resolve = {
    // Inject language settings
    settings: function($route, Settings) {
        return Settings.byLanguage($route.current.params.lang);
    },

    // Inject the hello world example
    helloWorld: function($route, Examples) {
        return Examples.byName($route.current.params.lang, "Hello World");
    },

    dbInfo: function(Couch) {
        return Couch.db("api").info();
    }
};

function ComposeController($scope, $rootScope, $routeParams, $location, Snippets, Runs, Utils, Segue, Url, settings, helloWorld, dbInfo) {
    var waitingForResult;
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
        var code = "";
        if (helloWorld && helloWorld.hasOwnProperty("code")) {
            // Set the hello world example as the initial code
            code = helloWorld.code;
        }

        $scope.code = Utils.ensureMinLines(code, 10);
    }

    $scope.run = function(code) {
        if (waitingForResult) {
            waitingForResult.stop();
        }

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
        if (waitingForResult) {
            waitingForResult.stop();
        }

        Snippets.create(language, name, code)
            .success(saveSuccess)
            .error(saveError);
    };

    function waitForResult(doc) {
        waitingForResult = Runs.onResult(doc._id, dbInfo.update_seq, function(doc) {
            $scope.result = doc.result;
        });

        // Stop listening for result if we leave the view
        $rootScope.$on("$routeChangeStart", function() {
            waitingForResult.stop();
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
