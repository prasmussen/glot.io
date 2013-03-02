'use strict';

// Directive used to verify password in two input fields of a form
angular.module('glotApp').directive("verifypassword", function() {
    return {
        require: "form",
        link: {
            post: function(scope, element, attr, form) {
                var ids = attr.verifypassword.split(" ");
                if (ids.length !== 2) {
                    return;
                }
                var first = form[ids[0]];
                var second = form[ids[1]];

                first.$parsers.push(function(value) {
                    second.$setValidity("password", value === second.$viewValue);
                    return value;
                });

                second.$parsers.push(function(value) {
                    second.$setValidity("password", value === first.$viewValue);
                    return value;
                });
            }
        }
    };
});
