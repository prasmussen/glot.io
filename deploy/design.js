var cradle = require("cradle");
var fs = require("fs");

var path = require("path");
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
var db = new(cradle.Connection)(config.url, config.port, {auth: {username: config.username, password: config.password}}).database(config.database);


db.save("_design/languages", {
    views: {
        list: {
            map: function(doc) {
                if (doc.type === "language") {
                    emit(null, doc);
                }
            }
        }
    }
});

db.save("_design/snippets", {
    views: {
        by_author: {
            map: function(doc) {
                if (doc.type === "snippet") {
                    emit(doc.author, doc);
                }
            }
        }
    }
});

db.save("_design/examples", {
    views: {
        list: {
            map: function(doc) {
                if (doc.type === "example") {
                    emit(null, doc);
                }
            }
        },

        by_language: {
            map: function(doc) {
                if (doc.type === "example") {
                    emit(doc.language, doc);
                }
            }
        },

        by_name: {
            map: function(doc) {
                if (doc.type === "example") {
                    emit([doc.language, doc.name], doc);
                }
            }
        }
    }
});

db.save("_design/settings", {
    views: {
        by_language: {
            map: function(doc) {
                if (doc.type === "settings") {
                    emit(doc.language, doc);
                }
            }
        }
    }
});

db.save("_design/profiles", {
    views: {
        by_author: {
            map: function(doc) {
                if (doc.type === "profile") {
                    emit(doc.author, doc);
                }
            }
        }
    }
});

