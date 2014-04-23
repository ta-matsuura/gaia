'use strict';
/* exported ValueSelector */
var contacts = window.contacts || {};

contacts.ValueSelector = (function() {


  return {
    data: {
      list: []
    },
    show: function() {
     /* call callback() immediately
      * when prompt showed.
      * Able to select any data you want.
      * ex) list[1].callback means that
      * user select second value. */
     this.data.list[0].callback();
    },
    hide: function() {
            this.data.list = [];
          },
    addToList: function(label, value, callback) {
      this.data.list.push({
        'type': [label],
        'value': value,
        'callback': callback
      });
    }
  };
})();

