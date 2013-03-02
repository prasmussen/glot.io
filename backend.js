var couchapp = require('couchapp');
var path = require('path');

var design = {
    _id: '_design/app',
    views: {},
    updates: {},

    rewrites: [
        // Frontend routes
        {from: "/", to: 'index.html'},
        {from: "/lib/*", to: 'lib/*'},
        {from: "/scripts/*", to: 'scripts/*'},
        {from: "/styles/*", to: 'styles/*'},
        {from: "/views/*", to: 'views/*'},

        // Backend routes
        {from: "/api", to: '../../'},
        {from: "/api/*", to: '../../*'},

        // Redirect all other paths to index.html
        {from: "/*", to: 'index.html'},
    ]
};


// Snippets update handler
design.updates.snippet = function(oldDoc, req) {
    var data = JSON.parse(req.body);
    var doc = {};

    if (req.method === "POST") {
        doc = createDoc(doc);
    } else if (req.method === "PUT") {
        if (!oldDoc) {
            var msg = "Document " + req.id + " not found";
            return [null, {code: 403, headers: {"Content-Type" : "text/plain"}, body: msg}];
        }
        doc = updateDoc(oldDoc);
    } else {
        return [null, "Invalid method: " + req.method];
    }

    function createDoc(newDoc) {
        newDoc._id = req.uuid;
        newDoc.author = req.userCtx.name || "_anonymous";
        newDoc.created = Date.now();
        newDoc.peers = [req.peer];
        newDoc.type = "snippet";
        return newDoc;
    }

    function updateDoc(oldDoc) {
        if (oldDoc.peers.indexOf(req.peer) === -1) {
            oldDoc.peers.push(req.peer);
        }
        return oldDoc;
    }

    doc.name = data.name;
    doc.language = data.language;
    doc.code = data.code;
    doc.updated = Date.now();

    // Only return doc._id?
    return [doc, toJSON(doc)];
};


// Document validation
design.validate_doc_update = function(newDoc, oldDoc, user) {
    // Allow admin to delete documents without any further validation
    if (newDoc._deleted === true && isAdmin(user)) {
        return;
    }

    // All documents must have a type
    require("type");

    validateType(newDoc.type, {
        snippet: function() {
            require("name");
            require("language");
            require("code");
            require("author");
            require("created");
            require("updated");
            require("peers");

            // Ensure author and created date is unchanged
            unchanged("author");
            unchanged("created");

            if (user.name === null) {
                enforce(newDoc.author === "_anonymous", "Author must be _anonymous for anonymous users");
            } else {
                enforce(newDoc.author === user.name, "You may only update documents with author: " + user.name);
            }
        },

        language: function() {
            enforce(isAdmin(user), "Only admin can create documents of this type");
            require("name");
        },

        example: function() {
            enforce(isAdmin(user), "Only admin can create documents of this type");
            require("language");
            require("name");
            require("code");
            require("author");
        },

        settings: function() {
            // TODO: Allow user settings, but modifications of default settings should not be allowed
            enforce(isAdmin(user), "Only admin can create documents of this type");
            require("language");
            require("mode");
        },

        profile: function() {
            require("name");
            if (oldDoc) {
                enforce(user.name !== null, "Must be logged in to update an existing profile");
                enforce(newDoc._id === user.name, "You may only update your own profile");
            }
        }
    });

    if (newDoc._deleted === true && !isAdmin(user)) {
        throw({forbidden: "Only admin can delete documents"});
    }

    // Helper functions
    function isAdmin(userCtx) {
        return userCtx.roles.indexOf("_admin") > -1;
    }

    function require(field) {
        var message = "Document must have a " + field;
        if (!newDoc[field]) {
            throw({forbidden : message});
        }
    }

    function unchanged(field) {
        if (oldDoc && toJSON(oldDoc[field]) != toJSON(newDoc[field])) {
            throw({forbidden : "Field can't be changed: " + field});
        }
    }

    function enforce(ok, message) {
        if (!ok) {
            throw({forbidden : message});
        }
    }

    function validateType(t, types) {
        function invalidType() {
            throw({forbidden: "Invalid type: " + t});
        }

        var fn = types[t] || invalidType;
        fn();
    }
};

couchapp.loadAttachments(design, path.join(__dirname, 'app'));

module.exports = design;
