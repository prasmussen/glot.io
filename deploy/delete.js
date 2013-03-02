var glob = require("glob");
var cradle = require("cradle");

var path = require("path");
var config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf8"));
var db = new(cradle.Connection)(config.url, config.port, {auth: {username: config.username, password: config.password}}).database(config.database);

// Delete all examples
db.view('examples/list', function(err, docs) {
    if (err) {
        console.log(err);
        return;
    }

    docs.forEach(function(doc) {
        db.remove(doc._id, doc._rev, function(err, res) {
            if (err) {
                console.log(err);
            }
        });
    });
});
