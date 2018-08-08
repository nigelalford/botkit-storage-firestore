var firebase = require('firebase');

/**
 * The Botkit firebase driver
 *
 * @param {Object} config This must contain either a `firebase_uri` property (deprecated) or a `databaseURL` property
 * @returns {{teams: {get, save, all}, channels: {get, save, all}, users: {get, save, all}}}
 */
module.exports = function(config) {

    if (!config) {
        throw new Error('configuration is required.');
    }
    if (!config.databaseURL && !config.database) {
        throw new Error('databaseURL or database is required.');
    }

    var app = null,
        database = null,
        settings = null;


    if (config.database) {
        database = config.database;
    } else {
        // Backwards compatibility shim
        var configuration = {};
        if (config.firebase_uri) {
            configuration.databaseURL = config.firebase_uri;
        } else {
            configuration = config;
        }

        if (!config.settings) {
            config.settings = {/* your settings... */ timestampsInSnapshots: true};
        }

        app = firebase.initializeApp(config);
        database = app.firestore();
        settings = database.settings(config.settings);

    }

    var rootRef = database,
        teamsRef = rootRef.collection('teams'),
        usersRef = rootRef.collection('users'),
        channelsRef = rootRef.collection('channels');

    return {
        teams: {
            get: get(teamsRef),
            save: save(teamsRef),
            all: all(teamsRef)
        },
        channels: {
            get: get(channelsRef),
            save: save(channelsRef),
            all: all(channelsRef)
        },
        users: {
            get: get(usersRef),
            save: save(usersRef),
            all: all(usersRef)
        }
    };
};

/**
 * Given a firebase ref, will return a function that will get a single value by ID
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The get function
 */
function get(firebaseRef) {
    return function(id, cb) {
        firebaseRef.doc(id).get().then(function(snapshot) {
                cb(null, snapshot.data());
            },
            cb);
    };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function save(firebaseRef) {
    return function(data, cb) {
        var firebase_update = {};
        firebase_update[data.id] = data;

        firebaseRef.doc(data.id).set(data, {merge: true}).then(cb);
    };
}

/**
 * Given a firebase ref, will return a function that will return all objects stored.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The all function
 */
function all(firebaseRef) {
    return function(cb) {
        firebaseRef.get().then(function success(records) {
            // var results = records.val();
            // console.log('all cb', cb, records);
            if (!records.exists) {
                return cb(null, []);
            }

            // var list = Object.keys(results).map(function(key) {
            //     return results[key];
            // });

            cb(null, records.map(result => result.data()));
        });
    };
}
