var couchapp = require('couchapp');
var path = require('path');

var design = {
    _id: '_design/app',
    views: {},
    updates: {},
    filters: {},
    lib: {},

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
    var crypto = require('lib/cryptojs');
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
        newDoc.type = "snippet";
        return newDoc;
    }

    function updateDoc(oldDoc) {
        return oldDoc;
    }

    doc.name = data.name;
    doc.language = data.language;
    doc.code = data.code;
    doc.peerhash = crypto.sha1(req.peer);
    doc.updated = Date.now();

    var res = toJSON({_id: doc._id});
    return [doc, res];
};

// Run update handler
design.updates.run = function(oldDoc, req) {
    var crypto = require('lib/cryptojs');
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
        newDoc.language = data.language;
        newDoc.code = data.code;
        newDoc.codehash = data.codehash;
        newDoc.author = req.userCtx.name || "_anonymous";
        newDoc.peerhash = crypto.sha1(req.peer);
        newDoc.created = Date.now();
        newDoc.type = "run";
        return newDoc;
    }

    function updateDoc(oldDoc) {
        oldDoc.result = data.result;
        return oldDoc;
    }

    doc.updated = Date.now();

    var res = toJSON({_id: doc._id});
    return [doc, res];
};

// Document validation
design.validate_doc_update = function(newDoc, oldDoc, user) {
    // Allow admin to delete documents without any further validation
    if (newDoc._deleted === true && isAdmin(user)) {
        return;
    }

    // All documents must have a type
    required("type");

    validateType(newDoc.type, {
        snippet: function() {
            required("name");
            required("language");
            required("code");
            required("author");
            required("created");
            required("updated");
            required("peerhash");

            // Ensure author and created date is unchanged
            unchanged("author");
            unchanged("created");

            if (user.name === null) {
                enforce(newDoc.author === "_anonymous", "Author must be _anonymous for anonymous users");
            } else {
                enforce(newDoc.author === user.name, "You may only update documents with author: " + user.name);
            }
        },

        run: function() {
            required("language");
            required("code");
            required("codehash");
            required("author");
            required("created");
            required("updated");
            required("peerhash");
            unchanged("language");
            unchanged("code");
            unchanged("codehash");
            unchanged("author");
            unchanged("peerhash");
            unchanged("created");

            if (user.name === null) {
                enforce(newDoc.author === "_anonymous", "Author must be _anonymous for anonymous users");
            } else if (!isAdmin(user)) {
                enforce(newDoc.author === user.name, "You may only update documents with author: " + user.name);
            }

            if (oldDoc) {
                enforce(isAdmin(user), "Only admin can update documents of this type");
            } else {
                enforce(newDoc.result === undefined, "Result can not be present on new documents");
            }
        },

        language: function() {
            enforce(isAdmin(user), "Only admin can create documents of this type");
            required("name");
        },

        example: function() {
            enforce(isAdmin(user), "Only admin can create documents of this type");
            required("language");
            required("name");
            required("code");
            required("author");
        },

        settings: function() {
            // TODO: Allow user settings, but modifications of default settings should not be allowed
            enforce(isAdmin(user), "Only admin can create documents of this type");
            required("language");
            required("mode");
        },

        profile: function() {
            required("name");
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

    function required(field) {
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

// Filter that return only run requests
design.filters.run_request = function(doc, req) {
    return doc.type === "run" && !doc.hasOwnProperty("result");
};

// Filter that return only run results
design.filters.run_result = function(doc, req) {
    if (req.query.id) {
        return doc._id === req.query.id;
    }
    return doc.type === "run" && doc.hasOwnProperty("result");
};

// CryptoJS.SHA1 wrapped as a CommonJS module
design.lib.cryptojs = "module.exports.sha1 = function(input) {\n    /*\n    CryptoJS v3.1.2\n    code.google.com/p/crypto-js\n    (c) 2009-2013 by Jeff Mott. All rights reserved.\n    code.google.com/p/crypto-js/wiki/License\n    */\n    var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty(\"init\")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty(\"toString\")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},\n    n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<\n    32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,\n    2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join(\"\")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error(\"Malformed UTF-8 data\");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},\n    k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){\"string\"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);\n    a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,\n    f)).finalize(b)}}});var s=p.algo={};return p}(Math);\n    (function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^\n    k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();\n\n    return CryptoJS.SHA1(input).toString();\n};\n";

couchapp.loadAttachments(design, path.join(__dirname, 'app'));

module.exports = design;
