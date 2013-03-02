'use strict';

LanguageController.resolve = {
    // Inject list of examples for selected language
    examples: function($route, Examples) {
        return Examples.byLanguage($route.current.params.lang);
    },

    // Inject language
    language: function($route, Languages) {
        return Languages.get($route.current.params.lang);
    }
};

function LanguageController($scope, examples, language) {
    $scope.examples = examples;
    $scope.language = language;
}
