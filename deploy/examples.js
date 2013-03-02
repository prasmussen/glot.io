var glob = require("glob");
var cradle = require("cradle");
var fs = require("fs");

var path = require("path");
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
var db = new(cradle.Connection)(config.url, config.port, {auth: {username: config.username, password: config.password}}).database(config.database);


// Update examples
glob("examples/*.json", function(err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(function(file) {
        var data = fs.readFileSync(file, "utf8");
        updateExample(JSON.parse(data));
    });
});

function updateExample(data) {
    // Set document type
    data.type = "example";

    // Check if there exist a document with the same name and language
    db.view('examples/by_name', {key: [data.language, data.name]}, function(err, docs) {
        if (err) {
            console.log(err);
            return;
        }

        if (docs.length === 0) {
            console.log("Creating new: " + data.language + " - " + data.name);
            db.save(data, function(err, res) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(res);
            });
        } else {
            console.log("Updating: " + data.language + " - " + data.name);
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
