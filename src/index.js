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

  var app = null;
  var database = null;

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
      config.settings = {
        timestampsInSnapshots: true,
      };
    }

    app = firebase.initializeApp(config);
    database = app.firestore();
    settings = database.settings(config.settings);
  }

  var rootRef = database;
  var storage = {};
  var collections;
  if (config.menthods) {
    collections = ['teams', 'users', 'channels'].concat(config.methods);
  } else {
    collections = ['teams', 'users', 'channels'];
  }

  // Implements required API methods
  for (var i = 0; i < collections.length; i++) {
    storage[collections[i]] = getStorageObj(rootRef.collection(collections[i]));
  }
  return storage;
};

/**
 * Function to generate a storage object for a given namespace
 *
 * @param {Object} collection The firestore collection
 * @returns {{get: get, save: save, all: all}}
 */
function getStorageObj(collection) {
  return {
    get: get(collection),
    save: save(collection),
    nestedSave: nestedCollectionSave(collection),
    nestedQuery: nestedCollectionQuery(collection),
    nestedCompoundQuery: nestedCollectionCompoundQuery(collection),
    all: all(collection),
    where: where(collection),
    ref: collection,
  };
}

/**
 * Given a firebase ref, will return a function that will get a single value by ID
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The get function
 */
function get(firebaseRef) {
  return function(id, cb) {
    firebaseRef
      .doc(id)
      .get()
      .then(snapshot => {
        if (snapshot.data) {
          cb(null, snapshot.data());
        }
      }, cb);
  };
}

function tester() {
  firebaseRef
    .doc(id)
    .get()
    .then(function(snapshot) {
      cb(null, snapshot.data());
    }, cb);
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

    firebaseRef
      .doc(data.id)
      .set(data, { merge: true })
      .then(doc => {
        if (!doc) {
          cb('No such document!', null);
        } else {
          cb(null, doc);
        }
      });
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
      if (records.empty) {
        return cb(null, []);
      }

      // var list = Object.keys(results).map(function(key) {
      //     return results[key];
      // });

      cb(null, records.docs.map(result => result.data()));
    });
  };
}

/**
 * Given a firebase ref, will return a function that will execute a specified where search.
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The all function
 */
function where(firebaseRef) {
  return (query, cb) => {
    firebaseRef
      .where(query[0], query[1], query[2])
      .get()
      .then(records => {
        if (records.empty) {
          return cb(null, []);
        }

        cb(null, records.docs.map(result => result.data()));
      });
  };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function nestedCollectionSave(firebaseRef) {
  return function(data, cb) {
    var firebase_update = {};
    firebase_update[data.id] = data;

    const document = data;

    firebaseRef
      .doc(data.docId)
      .collection(data.subCollection)
      .doc(data.id)
      .set(document, { merge: true })
      .then(doc => {
        if (!doc) {
          cb('No such document!', null);
        } else {
          cb(null, doc);
        }
      });
  };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function nestedCollectionQuery(firebaseRef) {
  return function(data, cb) {
    firebaseRef
      .doc(data.docId)
      .collection(data.subCollection)
      .where(data.query[0], data.query[1], data.query[2])
      .get()
      .then(records => {
        if (records.empty) {
          return cb(null, []);
        }
        cb(null, records.docs.map(result => result.data()));
      });
  };
}

/**
 * Given a firebase ref, will return a function that will save an object. The object must have an id property
 *
 * @param {Object} firebaseRef A reference to the firebase Object
 * @returns {Function} The save function
 */
function nestedCollectionCompoundQuery(firebaseRef) {
  return function(data, cb) {
    const first = data.query.first;
    const second = data.query.second;
    firebaseRef
      .doc(data.docId)
      .collection(data.subCollection)
      .where(first[0], first[1], first[2])
      .where(second[0], second[1], second[2])
      .get()
      .then(records => {
        if (records.empty) {
          return cb(null, []);
        }
        cb(null, records.docs.map(result => result.data()));
      });
  };
}
