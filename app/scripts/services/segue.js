'use strict';

// Service to transfer data between views
angular.module('glotApp').factory("Segue", function() {
    var data = "";

    return {
        setData: function(d) {
            data = d;
        },

        getData: function() {
            var buffer = data;
            data = "";
            return buffer;
        },

        hasData: function() {
            return data.length > 0;
        }
    };
});
