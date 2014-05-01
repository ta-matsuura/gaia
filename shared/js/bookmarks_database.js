
'use strict';

/* global Promise */

(function(exports) {

  var datastore;

  // Datastore name declared on the manifest.webapp
  var DATASTORE_NAME = 'bookmarks_store';

  // Indicates the initialization state
  var readyState;

  // Event listeners
  var listeners = Object.create(null);

  function init() {
    console.log('START');
    return new Promise(function doInit(resolve, reject) {
      console.log('Promise readyState : ' + readyState);
      if (readyState === 'initialized') {
        resolve();
        return;
      }
      console.log('--- 2');

      if (readyState === 'initializing') {
        document.addEventListener('ds-initialized', function oninitalized() {
          document.removeEventListener('ds-initialized', oninitalized);
          resolve();
        });
        return;
      }
      console.log('--- 3');

      readyState = 'initializing';

      if (!navigator.getDataStores) {
        console.error('Bookmark store: DataStore API is not working');
        reject({ name: 'NO_DATASTORE' });
        readyState = 'failed';
        return;
      }

      console.log('--- 4');
      navigator.getDataStores(DATASTORE_NAME).then(function(ds) {
        console.log('then ....');
        if (ds.length < 1) {
          console.error('Bookmark store: Cannot get access to the Store');
          reject({ name: 'NO_ACCESS_TO_DATASTORE' });
          readyState = 'failed';
          return;
        }

        datastore = ds[0];
        console.log('datastore.addEventListener onchangeHandler');
        datastore.addEventListener('change', onchangeHandler);
        readyState = 'initialized';
        document.dispatchEvent(new CustomEvent('ds-initialized'));
        resolve();
      }, reject);
    });
  }

  function doGetAll(resolve, reject) {
    console.log('START');
    var result = Object.create(null);
    var cursor = datastore.sync();

    function cursorResolve(task) {
      console.log('cursorResolve START');
      switch (task.operation) {
        case 'update':
        case 'add':
          console.log('update or add id:' + task.id);
          console.log('data : ' + Object.keys(task.data));
          result[task.data.id] = task.data;
          console.log('result[task.data.id] : ' + result[task.data.id]);
          console.log('Object.keys(result) : ' + Object.keys(result));
          break;

        case 'remove':
          console.log('remove task.data.id : ' + task.data.id);
          delete result[task.data.id];
          break;

        case 'clear':
          console.log('clear');
          result = Object.create(null);
          break;

        case 'done':
          console.log('done');
          console.log('operation : ' + task.operation);
          console.log('task.id : ' + task.id);
          resolve(result);
          return;
      }

      cursor.next().then(cursorResolve, reject);
      console.log('cursorResolve END');
    }

    cursor.next().then(cursorResolve, reject);
    console.log('doGetAll END');
  }

  function get(id) {
    console.log('get');
    return new Promise(function doGet(resolve, reject) {
      init().then(function onInitialized() {
        datastore.get(id).then(resolve, reject);
      }, reject);
    });
  }

  function getAll() {
    console.log('START');
    return new Promise(function doGet(resolve, reject) {
      console.log('call init()');
      init().then(doGetAll.bind(null, resolve, reject), reject);
    });
  }

  function onchangeHandler(event) {
    console.log('operation : ' + event.operation + '  id : ' + event.id);
    var operation = event.operation;
    var callbacks = listeners[operation];
    callbacks && callbacks.forEach(function iterCallback(callback) {
      console.log('call get');
      datastore.get(event.id).then(function got(result) {
        console.log('then... call callback');
        callback({
          type: operation,
          target: result || event
        });
      });
    });
  }

  function addEventListener(type, callback) {
    console.log('type : ' + type);
    if (!(type in listeners)) {
      listeners[type] = [];
    }

    var cb = callback;
    if (typeof cb === 'object') {
      cb = cb.handleEvent;
    }

    if (cb) {
      listeners[type].push(cb);
      init();
    }
  }

  function removeEventListener(type, callback) {
    console.log('removeEventListener type : ' + type);
    if (!(type in listeners)) {
      return false;
    }

    var callbacks = listeners[type];
    var length = callbacks.length;
    for (var i = 0; i < length; i++) {
      if (callbacks[i] && callbacks[i] === callback) {
        callbacks.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  function add(data) {
    console.log('START');
    return new Promise(function doAdd(resolve, reject) {
      console.log('call init()');
      init().then(function onInitialized() {
        console.log('then...');
        var id = data.url;

        Object.defineProperty(data, 'id', {
          enumerable: true,
          configurable: false,
          writable: false,
          value: id
        });

        console.log('call datastore.add : ' + data + ' id : ' + id);
        datastore.add(data, id).then(function add_success() {
          console.log('then... call resolve(true)');
          resolve(true); // Bookmark was added
        }, function add_error() {
          datastore.put(data, id).then(function put_success() {
            resolve(); // Bookmark was updated
          }, reject);
        });
      }, reject);
    });
  }

  function getRevisionId() {
    console.log('START');
    return new Promise(function doGet(resolve, reject) {
      console.log('called toGet');
      init().then(function onInitialized() {
        resolve(datastore.revisionId);
      }, reject);
    });
  }

  function put(data) {
    console.log('START');
    return new Promise(function doAdd(resolve, reject) {
      console.log('called doAdd() and call initi()');
      init().then(function onInitialized() {
        console.log('then... onInitialized');
        console.log('call datastore.put  data : ' +
          data + '   data.id' + data.id);
        datastore.put(data, data.id).then(function success() {
          resolve(); // Bookmark was updated
        }, reject);
      }, reject);
    });
  }

  function remove(id) {
    console.log('START id : ' + id);
    return new Promise(function doRemove(resolve, reject) {
      init().then(function onInitialized() {
        console.log('then... ');
        console.log('call datastore.remove id: ' + id);
        datastore.remove(id).then(resolve, reject);
      }, reject);
    });
  }

  exports.BookmarksDatabase = {
   /*
    * This method returns a bookmark object
    *
    * @param{String} String param that represents an identifier
    */
    get: get,

   /*
    * This method returns an object of bookmarks indexed by id
    */
    getAll: getAll,

   /*
    * Returns the latest revision UUID
    */
    getRevisionId: getRevisionId,

    /*
     * Method registers the specified listener on the API
     *
     * @param{String} A string representing the event type to listen for
     *
     * @param{Function} The method that receives a notification when an event of
     *                  the specified type occurs
     *
     */
    addEventListener: addEventListener,

    /*
     * Method removes the specified listener on the API
     *
     * @param{String} A string representing the event type to listen for
     *
     * @param{Function} The method that received a notification when an event of
     *                  the specified type occurs
     *
     */
    removeEventListener: removeEventListener,

    /*
     * This method adds a bookmark in the datastore
     *
     * @param{Object} The bookmark's data
     */
    add: add,

    /*
     * This method updates a bookmark in the datastore
     *
     * @param{Object} The bookmark's data
     */
     put: put,

    /*
     * This method removes a bookmark from the datastore
     *
     * @param{String} The bookmark's id
     */
     remove: remove
  };

}(window));
