/*
!! Warning !!
  This value selector is modified for email folder selection only.
  API and layout are changed because of the sub-folder indentation display.
  Please reference the original version selector in contact app before using.

How to:
  var prompt1 = new ValueSelector('Dummy title 1', [
    {
      label: 'Dummy element',
      callback: function() {
        alert('Define an action here!');
      }
    }
  ]);

  prompt1.addToList('Another button', 'depth0',
                    true, function(){alert('Another action');});
  prompt1.show();
*/
/*jshint browser: true */
/*global alert, define */
/*
define(function(require) {
console.log('---> define function(require)');

var FOLDER_DEPTH_CLASSES = require('folder_depth_classes'),
    mozL10n = require('l10n!');
*/
// Used for empty click handlers.
function noop() {}

function ValueSelector(title, list) {
  console.log('---> ValueSelector title : ' + title + '   list : ' + list);
  var init, show, hide, render, setTitle, emptyList, addToList,
      data, el;

  init = function() {
    console.log('---> init START');
    var strPopup, body, section, btnCancel, cancelStr;

    // Model. By having dummy data in the model,
    // it make it easier for othe developers to catch up to speed
    data = {
      title: 'No Title',
      list: [
        {
          label: 'Dummy element',
          callback: function() {
            alert('Define an action here!');
          }
        }
      ]
    };

    body = document.body;
    //TODO user L10!!
    //cancelStr = mozL10n.get('message-multiedit-cancel');
    cancelStr = 'Cancel';

    el = document.createElement('section');
    el.setAttribute('class', 'valueselector');
    el.setAttribute('role', 'region');

    strPopup = '<div role="dialog">';
    strPopup += '  <div class="center">';
    strPopup += '    <h3>No Title</h3>';
    strPopup += '    <ul>';
    strPopup += '      <li>';
    strPopup += '        <label class="pack-radio">';
    strPopup += '          <input type="radio" name="option">';
    strPopup += '          <span>Dummy element</span>';
    strPopup += '        </label>';
    strPopup += '      </li>';
    strPopup += '    </ul>';
    strPopup += '  </div>';
    strPopup += '  <menu>';
    strPopup += '    <button>' + cancelStr + '</button>';
    strPopup += '  </menu>';
    strPopup += '</div>';

    el.innerHTML += strPopup;
    body.appendChild(el);

    btnCancel = el.querySelector('button');
    btnCancel.addEventListener('click', function() {
      hide();
    });

    // Empty dummy data
    emptyList();

    // Apply optional actions while initializing
    if (typeof title === 'string') {
      setTitle(title);
    }

    if (Array.isArray(list)) {
      data.list = list;
    }
    console.log('---> init END');
  };

  show = function() {
    console.log('---> show START');
    render();
    el.classList.add('visible');
  };

  hide = function() {
    console.log('---> hide START');
    el.classList.remove('visible');
    emptyList();
  };

  render = function() {
    var title = el.querySelector('h3'),
        list = el.querySelector('ul');

    title.textContent = data.title;

    list.innerHTML = '';
    for (var i = 0; i < data.list.length; i++) {
      var li = document.createElement('li'),
          label = document.createElement('label'),
          input = document.createElement('input'),
          span = document.createElement('span'),
          text = document.createTextNode(data.list[i].label);

      input.setAttribute('type', 'radio');
      input.setAttribute('name', 'option');
      label.classList.add('pack-radio');
      label.appendChild(input);
      span.appendChild(text);
      label.appendChild(span);
      // Here we apply the folder-card's depth indentation to represent label.
      /*var depthIdx = data.list[i].depth;
      depthIdx = Math.min(FOLDER_DEPTH_CLASSES.length - 1, depthIdx);
      label.classList.add(FOLDER_DEPTH_CLASSES[depthIdx]);
*/

      // If not selectable use an empty click handler. Because of event
      // fuzzing, we want to have something registered, otherwise an
      // adjacent list item may receive the click.
      //var callback = data.list[i].selectable ? data.list[i].callback : noop;
      var callback = data.list[i].callback;
      if(callback) {
        li.addEventListener('click', callback, false);
      }

      li.appendChild(label);
      list.appendChild(li);
    }
  };

  setTitle = function(str) {
    data.title = str;
  };

  emptyList = function() {
    data.list = [];
  };

  /*addToList = function(label, depth, selectable, callback) {
    data.list.push({
      label: label,
      depth: depth,
      selectable: selectable,
      callback: callback
    });
  };*/
  addToList = function(label, value, callback) {
    data.list.push({
      label: label,
      value: value,
      callback: callback
    });
  };

  init();

  return{
    init: init,
    show: show,
    hide: hide,
    setTitle: setTitle,
    addToList: addToList,
    List: list
  };
}

//console.log('---> return ValueSelector');
//return ValueSelector;

//});
