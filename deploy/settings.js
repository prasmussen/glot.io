var glob = require("glob");
var cradle = require("cradle");
var fs = require("fs");

var path = require("path");
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
var db = new(cradle.Connection)(config.url, config.port, {auth: {username: config.username, password: config.password}}).database(config.database);


// Update settings
glob("settings/*.json", function(err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(function(file) {
        var data = fs.readFileSync(file, "utf8");
        update(JSON.parse(data));
    });
});

function update(data) {
    // Set document type
    data.type = "settings";

    // Check if there exist a document with the same name and language
    db.view('settings/by_language', {key: data.language}, function(err, docs) {
        if (err) {
            console.log(err);
            return;
        }

        if (docs.length === 0) {
            console.log("Creating new: " + data.language);
            db.save(data, function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(res);
            });
        } else {
            console.log("Updating: " + data.language);
            db.save(docs[0].id, data, function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(res);
            });
        }
    });
}
