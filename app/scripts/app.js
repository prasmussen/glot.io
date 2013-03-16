'use strict';


angular.module('glotApp', ["ui"])

// UrlProvider
// setRoutes takes an array of objects with attributes 'name' and 'url'.
// url can be of type /:foo/:bar
// When injected the Url instance will hold a object of url generator functions
// with 'name' as the key. A _<name> key is also added to get the html5 version
// of the url (without the hash prefix).
//
// Example:
// UrlProvider.setRoutes([
//   {
//     name: "profile",
//     url: "/profile"
//   },
//   {
//     name: "userDetails",
//     url: "/user/:userId"
//   }
// ]);
//
// Url.profile() => "/#/profile"
// Url.userDetails("42") => "/#/user/42"
// Url._userDetails("42") => "/user/42"
.provider('Url', function() {
    var prefix = "/#";
    var urls = {};

    function urlGenerator(url, html5mode) {
        return function() {
            var result = url;
            var args = Array.prototype.slice.call(arguments);
            args.forEach(function(arg) {
                result = result.replace(/:[^\/]+/, arg);
            });

            if (!html5mode) {
                result = prefix + result;
            }

            return result;
        };
    }

    return {
        $get: function() {
            return urls;
        },

        setRoutes: function(routes, html5mode) {
            routes.forEach(function(route) {
                urls[route.name] = urlGenerator(route.url, html5mode);
                urls["_" + route.name] = urlGenerator(route.url, true);
            });
        },
    };
})

.config(["$routeProvider", "$locationProvider", "UrlProvider", function($routeProvider, $locationProvider, UrlProvider) {
    var routes = [
        {
            name: "index",
            url: "/",
            controller: MainController,
            templateUrl: "/views/main.html"
        },
        {
            name: "signup",
            url: "/signup",
            controller: SignupController,
            templateUrl: "/views/signup.html"
        },
        {
            name: "login",
            url: "/login",
            controller: LoginController,
            templateUrl: "/views/login.html"
        },
        {
            name: "profile",
            url: "/profile",
            controller: ProfileController,
            templateUrl: "/views/profile.html"
        },
        {
            name: "resetPassword",
            url: "/profile/password",
            controller: ProfileController,
            templateUrl: "/views/password.html"
        },
        {
            name: "authorSnippets",
            url: "/author/:id",
            controller: AuthorController,
            resolve: AuthorController.resolve,
            templateUrl: "/views/author.html"
        },
        {
            name: "language",
            url: "/:lang",
            controller: LanguageController,
            resolve: LanguageController.resolve,
            templateUrl: "/views/language.html"
        },
        {
            name: "composeSnippet",
            url: "/:lang/compose",
            controller: ComposeController,
            resolve: ComposeController.resolve,
            templateUrl: "/views/compose.html"
        },
        {
            name: "editSnippet",
            url: "/:lang/:id",
            controller: SnippetController,
            resolve: SnippetController.resolve,
            templateUrl: "/views/snippet.html"
        },
    ];

    // Set up routes
    routes.forEach(function(route) {
        $routeProvider.when(route.url, {
            controller: route.controller,
            templateUrl: route.templateUrl,
            resolve: route.resolve
        });
    });

    // Default action for non matching routes
    $routeProvider.otherwise({redirectTo: "/"});

    // Activate html5mode
    $locationProvider.html5Mode(true);

    // Add routes to url provider
    UrlProvider.setRoutes(routes, true);
}]);
