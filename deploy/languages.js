var glob = require("glob");
var cradle = require("cradle");
var fs = require("fs");

var path = require("path");
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
var db = new(cradle.Connection)(config.url, config.port, {auth: {username: config.username, password: config.password}}).database(config.database);


// Update languages
glob("languages/*.json", function(err, files) {
    if (err) {
        console.log(err);
        return;
    }

    files.forEach(function(file) {
        var data = fs.readFileSync(file, "utf8");
        updateLanguage(JSON.parse(data));
    });
});

function updateLanguage(data) {
    // Grab id from file, and delete it from the posted document
    var id = data.id;
    delete data.id;

    // Set document type
    data.type = "language";

    db.save(id, data, function(err, res) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(res);
    });
}
