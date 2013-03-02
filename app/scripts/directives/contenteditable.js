'use strict';

angular.module('glotApp').directive('contenteditable', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: '?ngModel', // get a hold of NgModelController
        link: function(scope, element, attrs, ngModel) {
            if(!ngModel) {
                return;
            }

            // Specify how UI should be updated
            ngModel.$render = function() {
                element.html(ngModel.$viewValue || '');
            };

            // Listen for change events to enable binding
            element.bind('blur keyup change', function() {
                scope.$apply(read);
            });


            // Grab value from scope if no html value is set
            if (!element.html()) {
                var value = scope.$eval(attrs.ngModel);
                element.html(value);
            }

            // Initialize
            read();

            // Write data to the model
            function read() {
                ngModel.$setViewValue(element.html());
            }
        }
    };
});
