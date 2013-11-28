
'use strict';

var Folder = function Folder(params, cb) {
  GridItem.call(this, params);

  this.iconable = false;
  this.type = GridItemsFactory.TYPE.FOLDER;
  this.hideFromGrid = !!params.hideFromGrid;
  this.providerId = params.provider_id || params.id;
  this.icons = params.hangApps;
  this.isInFolder = params.isInFolder || false;
};

Folder.prototype = {
  __proto__: GridItem.prototype,
  MAX_ICON: 10,

  launch: function fc_launch() {
    console.log('---> launch : fc_launch');
    var features = this.getFeatures();
    // Enriching features...
    features.id = this.id;

    window.dispatchEvent(new CustomEvent('folderlaunch', {
      'detail': features
    }));
  }
};

var FolderManager = (function() {
  var dragElem, prevElem, folderElem, range;
  var state; // none/pending/done
  var SIZE = 60;

  function _setBorder(elem) {
    if (!elem) {
      return;
    }
    if (elem.dataset.isCollection !== 'true') {
      elem.classList.add('folder');
    }
  }

  function _unsetBorder(elem) {
    if (!elem) {
      return;
    }
    elem.classList.remove('folder');
  }

  function _isRange(x, y) {
    if (!range) {
      return false;
    }
    if (x > range.left && x < range.right &&
        y > range.top && y < range.bottom) {
      return true;
    } else {
      return false;
    }
  }

  function _isUnRange(x, y) {
    if (!range) {
      return false;
    }
    if (x < range.left || x > range.right ||
        y < range.top || y > range.bottom) {
      return true;
    } else {
      return false;
    }
  }

  function _clearState() {
    state = 'none';
    if (folderElem != null) {
      folderElem.dataset.isTargetfolder = null;
    }
    range = prevElem = folderElem = null;
  }

  function _getState() {
     return state;
  }

  function _startMakeFolder(elem) {
    if (dragElem.dataset.isCollection || !elem || elem.dataset.isCollection) {
      console.log('collection check : ' + dragElem.dataset.isCollection +
          ' : ' + elem + ' : ' + elem.dataset.isCollection);
      return;
    }
    if (dragElem.dataset.isFolder) {
      console.log('folder icon check : ' + dragElem.dataset.isFolder);
      return;
    }
    if (elem === dragElem || elem === prevElem) {
      console.log('elem check');
      return;
    }
    prevElem = elem;

    switch (state) {
    case 'none':
      // Making folder start
      var rect = elem.getBoundingClientRect();
      range = {left: rect.left + 15, right: rect.right - 15,
        top: rect.top + 20, bottom: rect.bottom - 20};
      state = 'pending';
      console.log('state===none, range left=' +
        range.left + ' right=' + range.right +
        ' top=' + range.top + ' bottom=' + range.bottom);
      break;
    case 'done':
      // The folder is already maked and delete the folder
      _unsetBorder(folderElem);
      _clearState();
      console.log('state===done, set none');
      break;
    default:
      console.log('state===default');
      break;
    }
  }

  function _updateFolder(elem, x, y) {
    if (dragElem.dataset.isCollection || !elem || elem.dataset.isCollection) {
      console.log('collection check : ' + dragElem.dataset.isCollection +
          ' : ' + elem + ' : ' + elem.dataset.isCollection);
      return;
    }
    if (dragElem.dataset.isFolder) {
      console.log('folder icon check : ' + dragElem.dataset.isFolder);
      return;
    }
    switch (state) {
    case 'pending':
      if (_isRange(x, y)) {
        _setBorder(elem);
        folderElem = elem;
        folderElem.dataset.isTargetfolder = 'true';
        state = 'done';
        console.log('state===pending, set done x=' + x + ' y=' + y);
        return true;
      } else {
        _clearState();
        console.log('state===pending, set none x=' + x + ' y=' + y);
        return false;
      }
    case 'done':
      if (_isUnRange(x, y)) {
        _unsetBorder(folderElem);
        _clearState();
        console.log('state===done, set none x=' + x + ' y=' + y);
        return false;
      } else {
        console.log('state===done, set !none x=' + x + ' y=' + y);
        return false;
      }
    default:
      console.log('state===default');
      _clearState();
      break;
    }
  }

  var iconsGroupSettings = {
    '1': [{
      'x': 'center',
      'y': 'center',
      'size': 0.65,
      'shadowOffsetX': 0,
      'shadowOffsetY': 2,
      'shadowBlur': 2,
      'shadowOpacity': 0.8
    }],
    '2': [{
      'x': 24,
      'y': 'center',
      'size': 0.5,
      'shadowOffsetX': 0,
      'shadowOffsetY': 2,
      'shadowBlur': 2,
      'shadowOpacity': 0.7
    },
    {
      'x': 6,
      'y': 'center',
      'size': 0.6,
      'shadowOffsetX': 0,
      'shadowOffsetY': 2,
      'shadowBlur': 2,
      'shadowOpacity': 0.8
    }],
    '3': [{
      'x': 'right',
      'y': 'center',
      'size': 0.45,
      'shadowOffsetX': 1,
      'shadowOffsetY': 1,
      'shadowBlur': 2,
      'shadowOpacity': 0.4
    },
    {
      'x': 'center+4',
      'y': 'center',
      'size': 0.5,
      'shadowOffsetX': 1,
      'shadowOffsetY': 1,
      'shadowBlur': 2,
      'shadowOpacity': 0.7
    },
    {
      'x': 'left',
      'y': 'center',
      'size': 0.6,
      'shadowOffsetX': 1,
      'shadowOffsetY': 1,
      'shadowBlur': 2,
      'shadowOpacity': 0.9
    }]
  };

  function _makeIcon(iconBlobs, callback) {
    // Create canvas context for drawing folder icon
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    var context = canvas.getContext('2d');

    var numberOfIcons = iconBlobs.length;
    var settings = iconsGroupSettings[numberOfIcons];
    context.imagesToLoad = numberOfIcons;
    context.imagesLoaded = [];

    for (var i = 0; i < numberOfIcons; i++) {
      var iconBlob = iconBlobs[(numberOfIcons - 1) - i];
      if (iconBlob) {
        var iconSettings = settings[(settings.length - numberOfIcons) + i];
        _loadIcon(iconBlob, iconSettings, context, i, callback);
      }
    }
  }

  function _loadIcon(iconBlob, settings, context, index, callback) {
    var image = new Image();

    image.onload = function() {
      var _canvas = document.createElement('canvas');
      var _context = _canvas.getContext('2d');
      var fixedImage = new Image();
      //size = Math.round(settings.size * SIZE);
      var size = 36;
      _canvas.width = _canvas.height = size;
      _context.drawImage(this, 0, 0, size, size);
      fixedImage.onload = function() {
        _onIconLoaded(context, this, settings, index, callback);
      };
      fixedImage.src = _canvas.toDataURL('image/png');
    };

    image.src = window.URL.createObjectURL(iconBlob);
  }

  function _onIconLoaded(context, image, settings, index, callback) {
    // once the image is ready to be drawn, we add it to an array
    // so when all the images are loaded we can draw them in the right order
    context.imagesLoaded.push({
      'image': image,
      'settings': settings,
      'index': index
    });

    if (context.imagesLoaded.length === context.imagesToLoad) {
      // all the images were loaded- let's sort correctly before drawing
      context.imagesLoaded.sort(function(a, b) {
        return a.index > b.index ? 1 : a.index < b.index ? -1 : 0;
      });

      // finally we're ready to draw the icons!
      for (var i = 0, obj; obj = context.imagesLoaded[i++];) {
        image = obj.image;
        settings = obj.settings;

        if (!image) {
          continue;
        }

        var size = image.width;
        var shadowBounds = (settings.shadowOffsetX || 0);

        // shadow
        context.shadowOffsetX = settings.shadowOffsetX || 0;
        context.shadowOffsetY = settings.shadowOffsetY || 0;
        context.shadowBlur = settings.shadowBlur;
        context.shadowColor = 'rgba(0, 0, 0, ' + settings.shadowOpacity + ')';

        var x = _parse(settings.x, size);
        var y = _parse(settings.y, size);

        // rotation
        if (settings.rotate) {
          context.save();
          context.translate(x + size / 2, y + size / 2);
          context.rotate((settings.rotate || 0) * Math.PI / 180);
          context.drawImage(image, -size / 2, -size / 2);
          context.restore();
        } else {
          context.drawImage(image, x, y);
        }
      }

      callback && callback(context.canvas);
    }

    function _parse(value, size) {
      var newValue = value,
          match = value.toString().match(/(center|left|right)(\+|\-)?(\d+)?/);

      if (match) {
        var pos = match[1],
          op = match[2],
             mod = (parseInt(match[3]) || 0) * SCALE_RATIO;

        switch (pos) {
          case 'center': newValue = (SIZE - size) / 2; break;
          case 'left': newValue = 0; break;
          case 'right': newValue = SIZE - size - shadowBounds; break;
        }

        switch (op) {
          case '+': newValue += mod; break;
          case '-': newValue -= mod; break;
        }
      } else {
        // if the value is a plain integer - need to adjust for pixel ratio
        newValue *= SCALE_RATIO;
      }

      return parseInt(newValue) || 0;
    }
  }

  var container;

  function _addListener(_container) {
    container = _container;
    container.addEventListener(touchstart, _handleEvent.bind(this), true);
  }

  function _removeListener() {
    this.getContainer().removeEventListener(touchstart, _handleEvent);
    this.getContainer().removeEventListener(touchmove, _handleEvent);
    this.getContainer().removeEventListener(touchend, _handleEvent);
  }

  var isTouch = 'ontouchstart' in window;
  var touchstart = isTouch ? 'touchstart' : 'mousedown';
  var touchmove = isTouch ? 'touchmove' : 'mousemove';
  var touchend = isTouch ? 'touchend' : 'mouseup';

  function _handleEvent(evt) {
    switch (evt.type) {
      case touchstart:
        this.getContainer().addEventListener(touchmove, _handleEvent, true);
        this.getContainer().addEventListener(touchend, _handleEvent);
        break;

      case touchmove:
        break;

      case touchend:
        var icon = GridManager.getIcon(evt.target.dataset);
        icon.app.launch();
        break;
    }
  }

  function _getContainer() {
    return container;
  }

  return {
    init: function(elem) {
      console.log('init elem=' + elem.textContent);
      dragElem = elem;
      _clearState();
    },
    startMakeFolder: _startMakeFolder,
    updateFolder: _updateFolder,
    makeIcon: _makeIcon,
    getState: _getState,
    addListener: _addListener,
    removeListener: _removeListener,
    getContainer: _getContainer,
    getDragElem: function() { return dragElem; },
    getFolderElem: function() { return folderElem; }
  };
})();


var FolderViewer = (function() {
  var folderElem = document.getElementById('folder');
  var headerElem = folderElem.getElementsByClassName('header')[0];
  var titleElem = folderElem.getElementsByClassName('title')[0];
  var closeElem = folderElem.getElementsByClassName('close')[0];
  var contentElem = folderElem.getElementsByClassName('content')[0];
  var appsElem = contentElem.querySelector('.apps-wrapper .static');
  var appList = {};

  function onFolderLaunch(evt) {
    deleteAllAppsElem();
    // Get Icon info
    var icon = GridManager.getIconForBookmark(evt.detail.id);
    var descriptor = icon.descriptor;

    // Set folder title
    titleElem.innerHTML = '<span>' + descriptor.name + '</span>';
    // Set icon images in the folder
    var app;
    var image = [], li = [], url = [];
    var length = descriptor.hangApps.length;
    for (var i = 0; i < length; i++) {
      app = descriptor.hangApps[i];
      li[i] = document.createElement('li');
      li[i].id = app.manifestURL;
      li[i].dataset.name = app.name;
      li[i].dataset.manifestURL = app.manifestURL;
      if (app.entry_point) {
        li[i].dataset.entry_point = app.entry_point;
      }
      image[i] = new Image();
      image[i].className = 'icon';
      image[i].style.width = '64px';
      image[i].style.height = '64px';
      image[i].dataset.manifestURL = app.manifestURL;
      if (app.entry_point) {
        image[i].dataset.entry_point = app.entry_point;
      }
      url[i] = window.URL.createObjectURL(app.renderedIcon);
      image[i].src = url[i];
      image[i].onload = image[i].onerror = function() {
        if (i === length) {
          for (var ii = 0; ii < length; ii++) {
            window.URL.revokeObjectURL(url[ii]);
            li[ii].dataset.loaded = 'true';
          }
          FolderManager.addListener(contentElem);
        }
      };
      li[i].appendChild(image[i]);
      appsElem.appendChild(li[i]);
    }

    closeElem.addEventListener('click', function() {
      hideUI();
    });

    showUI();
  }

  function showUI() {
    folderElem.style.display = 'block';
    window.setTimeout(function() {
      folderElem.addEventListener('transitionend', function end(e) {
        e.target.removeEventListener('transitionend', end);
        document.dispatchEvent(new CustomEvent('folderopened'));
        folderElem.addEventListener('contextmenu', noop);
      });
      folderElem.classList.add('visible');
    }, 0);
  }

  function hideUI() {
    headerElem.addEventListener('transitionend', function end(e) {
      e.target.removeEventListener('transitionend', end);
      folderElem.style.display = 'none';
    });
    folderElem.classList.remove('visible');
    folderElem.removeEventListener('contextmenu', noop);
    FolderManager.removeListener();
  }

  function init() {
    window.addEventListener('folderlaunch', onFolderLaunch);
  }

  function fin() {
    closeElem.removeEventListener('click');
  }

  function deleteAllAppsElem() {
    for (var i = appsElem.childNodes.length - 1; i >= 0; i--) {
      appsElem.removeChild(appsElem.childNodes[i]);
    }
  }

  function noop(evt) {
    evt.stopPropagation();
  }

  init();
})();
