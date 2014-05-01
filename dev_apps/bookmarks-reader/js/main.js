'use strict';

(function() {

  var list = document.querySelector('section ul');

  function appendBookmark(data) {
    var item = document.createElement('li');
    item.dataset.id = data.id;
    var name = document.createElement('p');
    name.textContent = data.name;
    item.appendChild(name);
    var url = document.createElement('p');
    url.textContent = data.url;
    item.appendChild(url);
    list.appendChild(item);
    item.addEventListener('click', function() {
      window.open(item.querySelector('p:nth-child(2)').textContent, '_blank');
    });
  }

  function updateBookmark(data) {
    var item = document.querySelector('li[data-id="' + data.id + '"]');
    item.querySelector('p:first-child').textContent = data.name;
    item.querySelector('p:nth-child(2)').textContent = data.url;
  }

  function removeBookmark(data) {
    list.removeChild(document.querySelector('li[data-id="' + data.id + '"]'));
  }

  var BookmarksListener = {
    handleEvent: function(e) {
      console.log('e.type ' + e.type);
      console.log('e.target ' + e.target);
      switch (e.type) {
        case 'added':
          appendBookmark(e.target);
          break;

        case 'updated':
          updateBookmark(e.target);
          break;

        case 'removed':
          removeBookmark(e.target);
          break;
      }
    }
  };

  var eventTypesToListenFor = ['added', 'updated', 'removed'];
  eventTypesToListenFor.forEach(function iterateTypes(type) {
    BookmarksDatabase.addEventListener(type, BookmarksListener);
  });

  // Populate list
  console.log(' BookmarksDatabase.getAll()');
  BookmarksDatabase.getAll().then(function(bookmarks) {
    // We are going to iterate over system bookmarks
    Object.keys(bookmarks).forEach(function(id) {
      console.log('then ... getAll  id: ' + id);
      console.log('then ... bookmarks name: ' + bookmarks[id].name);
      console.log('then ... bookmarks url: ' + bookmarks[id].url);
      console.log('then ... bookmarks id: ' + bookmarks[id].id);
      appendBookmark(bookmarks[id]);
    });
  });
}());
