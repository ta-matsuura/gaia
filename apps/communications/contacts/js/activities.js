/* globals _, ConfirmDialog, Contacts, LazyLoader, utils, ValueSelector */
/* exported ActivityHandler */

'use strict';

var Result = function() {
  this.name;
  this.contact = {};
  this.select = [];
};

var ActivityHandler = {
  _currentActivity: null,

  _launchedAsInlineActivity: (window.location.search == '?pick'),

  get currentlyHandling() {
    return !!this._currentActivity;
  },

  get activityName() {
    if (!this._currentActivity) {
      return null;
    }

    return this._currentActivity.source.name;
  },

  get activityDataType() {
    if (!this._currentActivity) {
      return null;
    }

    return this._currentActivity.source.data.type;
  },

  launch_activity: function ah_launch(activity, action) {
    if (this._launchedAsInlineActivity) {
      return;
    }

    this._currentActivity = activity;
    var hash = action;
    var param, params = [];
    if (activity.source &&
        activity.source.data &&
        activity.source.data.params) {
      var originalParams = activity.source.data.params;
      for (var i in originalParams) {
        param = originalParams[i];
        params.push(i + '=' + param);
      }
      hash += '?' + params.join('&');
    }
    document.location.hash = hash;
  },
  handle: function ah_handle(activity) {

    switch (activity.source.name) {
      case 'new':
        this.launch_activity(activity, 'view-contact-form');
        break;
      case 'open':
        this.launch_activity(activity, 'view-contact-details');
        break;
      case 'update':
        this.launch_activity(activity, 'add-parameters');
        break;
      case 'pick':
        if (!this._launchedAsInlineActivity) {
          return;
        }
        this._currentActivity = activity;
        Contacts.navigation.home();
        break;
      case 'import':
        this.importContactsFromFile(activity);
        break;
    }
    Contacts.checkCancelableActivity();
  },

  importContactsFromFile: function ah_importContactFromVcard(activity) {
    var self = this;
    if (activity.source &&
        activity.source.data &&
        activity.source.data.blob) {
      LazyLoader.load([
        '/contacts/js/utilities/import_from_vcard.js',
        '/contacts/js/utilities/overlay.js'
      ], function loaded() {
        utils.importFromVcard(activity.source.data.blob, function imported(id) {
          if (id) {
            activity.source.data.params = {id: id};
          }
          self.launch_activity(activity, 'view-contact-details');
        });
      });
    } else {
      this._currentActivity.postError('wrong parameters');
      this._currentActivity = null;
    }
  },

  dataPickHandler: function ah_dataPickHandler(theContact) {
    var type, dataSet, noDataStr;
    var result = new Result();
    var contact = [];

    switch (this.activityDataType) {
      case 'webcontacts/tel':
        type = 'contact';
        dataSet = theContact.tel;
        noDataStr = _('no_contact_phones');
        break;
      case 'webcontacts/contact':
        type = 'number';
        dataSet = theContact.tel;
        noDataStr = _('no_contact_phones');
        break;
      case 'webcontacts/email':
        type = 'email';
        dataSet = theContact.email;
        noDataStr = _('no_contact_email');
        break;
      case 'webcontacts/msg':
        type = 'msg';
        if (theContact.tel) {
          dataSet = this.copyTelEmail(contact, theContact.tel);
        }
        if (theContact.email) {
          dataSet = this.copyTelEmail(contact, theContact.email);
        }
        noDataStr = _('no_contact_data');
        break;
    }
    var hasData = dataSet && dataSet.length;
    var numOfData = hasData ? dataSet.length : 0;

    result.name = theContact.name;
    switch (numOfData) {
      case 0:
        // If no required type of data
        var dismiss = {
          title: _('ok'),
          callback: function() {
            ConfirmDialog.hide();
          }
        };
        Contacts.confirmDialog(null, noDataStr, dismiss);
        break;
      case 1:
        // if one required type of data
        if (this.activityDataType == 'webcontacts/tel' ||
            this.activityDataType == 'webcontacts/msg') {
          result.contact = utils.misc.toMozContact(theContact);
          result.select = result.contact.tel;
          if (!result.select || !result.select.length) {
            result.select = result.contact.email;
          }
        } else {
          result[type] = dataSet[0].value;
        }
        this.postPickSuccess(result);
        break;
      default:
        var self = this;
        var selectorTitle = _('select_recipient');
        // if more than one required type of data
        var prompt1 = new ValueSelector(selectorTitle);
        var data;
        for (var i = 0; i < dataSet.length; i++) {
          data = dataSet[i].value;
          var carrier = dataSet[i].carrier || '';
          prompt1.addToList(data + ' ' + carrier, data,
          function(data) {
            return function() {
              result.contact = utils.misc.toMozContact(theContact);
              result.select = self.filterPhoneNumberForActivity(data, result.contact.tel);
              if (result.select.length == 0)
                result.select =
                  self.filterEmailAddrForActivity(data, result.contact.email);
              prompt1.hide();
              self.postPickSuccess(result);
            };
          }(data));
        }
        prompt1.show();
    } // switch
  },


  copyTelEmail: function ah_copyTelEmail(arr, data) {
    var alen = arr.length;
    var dlen = data.length;
    for (var i = 0; i < dlen; i++) {
      if (dlen === alen) { arr[alen] = data[i]; }
      else { arr[alen] = data[i]; }
      alen++;
    }
    return arr;
  },


  /*
   * We only need to return the phone number that user chose from the select
   * Hence we filter out the rest of the phones from the contact
   */
  filterPhoneNumberForActivity:
  function ah_filterPhoneNumberForActivity(itemData, dataSet) {
    return dataSet.filter(function isSamePhone(item) {
      return item.value == itemData;
    });
  },

  filterEmailAddrForActivity:
  function ah_filterEmailAddrForActivity(itemData, dataSet) {
    return dataSet.filter(function isSameEmail(item) {
      return item.value == itemData;
    });
  },

  postNewSuccess: function ah_postNewSuccess(contact) {
    this._currentActivity.postResult({ contact: contact });
    this._currentActivity = null;
  },

  postPickSuccess: function ah_postPickSuccess(result) {
    this._currentActivity.postResult(result);
    this._currentActivity = null;
  },

  postCancel: function ah_postCancel() {
    this._currentActivity.postError('canceled');
    this._currentActivity = null;
  }
};
