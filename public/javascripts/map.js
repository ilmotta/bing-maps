var Map = (function() {
  var ADVERTISER = 0;
  var PUBLISHER  = 1;
  var DEFAULT_ZOOM = 5;

  var map = null;
  var interval = null;
  var hideInfoBox = null;

  return {
    map: function() { return map; },

    load: function(users) {
      map = new VEMap('map');
      map.LoadMap();
      map.ClearInfoBoxStyles();
      map.SetMapStyle(getCookieStyle() || VEMapStyle.Road);
      removeUnusedControls();
      addPushpins(users);

      // Backup the original hide function.
      // Overwrite it with a simple +return+, effectively disabling the default behavior.
      hideInfoBox = window.ero.hide;
      window.ero.hide = function() { return; };

      // The default delay is 500ms. But half a second is too long! After a click event
      // is triggered the user expects an almost instant response.
      window.ero.setDelay(1);

      var center = getLatLongFromCookie() || new VELatLong(users[0].latitude, users[0].longitude);
      var zoom = isNaN(getCookieZoom()) ? DEFAULT_ZOOM : getCookieZoom();
      map.SetCenterAndZoom(center, zoom);

      attachEvents();
      setCookieStyle();
      setCookieZoom();
    },

    // A public function to hide the InfoBox because the original one has no effect.
    hideInfoBox: function() { hideInfoBox.call(); },

    find: function(where) {
      map.Find(null, where, VEFindType.Businesses, null, null, null, null, null, true, true, function(layer, resultsArray, places) {
        return places;
      });
    },
    
    getShapeLayer: function() {
      return map.GetShapeLayerByIndex(1);
    },
    
    showAllShapes: function() {
      var shapeLayer = Map.getShapeLayer();
      for (var i = 0; i < shapeLayer.GetShapeCount(); i++) {
        shapeLayer.GetShapeByIndex(i).Show();
      }
    }
  };

  function addPushpins(users) {
    if (users.length == 0)
      return;

    var newShapes = [];
    var shapeLayer = new VEShapeLayer();
    $.each(users, function(i, user) { newShapes.push(createPushpin(user)); });
    map.DeleteAllShapeLayers();
    map.AddShapeLayer(shapeLayer);
    shapeLayer.AddShape(newShapes);
  }

  function createPushpin(user) {
    var latLong = new VELatLong(user.latitude, user.longitude);
    var pin = new VEShape(VEShapeType.Pushpin, latLong);
    var klass = user.role == ADVERTISER ? 'icon-a' : 'icon-p';
    pin.SetCustomIcon('<div class="'+klass+' "' + 'data-user-id="'+user.id+'" ' + 'data-user-type="'+user.role+'" ' + 'data-user-category_id="'+user.category_id+'"></div>');
    return pin;
  }

  function removeUnusedControls() {
    $('#MSVE_navAction_View3DMapMode,\
       #MSVE_navAction_FlatlandMapMode,\
       #MSVE_navAction_separator0,\
       #MSVE_navAction_ObliqueMapView').remove();
  }

  // ==================
  // = Event Handlers =
  // ==================
  function attachEvents() {
    map.AttachEvent('onmouseover', preventDefaultEvent);
    map.AttachEvent('onmouseout', preventDefaultEvent);
    map.AttachEvent('onclick', onClick);
    map.AttachEvent('onendpan', refreshVisibleMap);
    map.AttachEvent('onendzoom', onEndZoom);
    map.AttachEvent('onchangeview', onChangeView);

    // The InfoBox must be hidden due to the fact that its position
    // is not relocated when the pushpin "moves".
    map.AttachEvent('onstartpan', Map.hideInfoBox);
    map.AttachEvent('onstartzoom', Map.hideInfoBox);
  }

  function onChangeView() {
    setCookieZoom();
    setCookieStyle();
    setCookieCenter();
  }

  function preventDefaultEvent() {
    return true;
  }

  // Set the pushpin description by making an AJAX call if the +InfoBox+
  // description is empty. Otherwise just call +ShowInfoBox+.
  function onClick(event) {
    Map.hideInfoBox();
    if (event.elementID) {
      var pin = map.GetShapeByID(event.elementID);
      if (pin.GetDescription()) {
        map.ShowInfoBox(pin);
      } else {
        var icon = $(pin.GetCustomIcon());
        var userID = icon.attr('data-user-id');
        $.get('/users/'+userID, function(html) {
          pin.SetDescription(html);
          map.ShowInfoBox(pin);
        });
      }
    }
  }

  function onEndZoom(event) {
    if (event.zoomLevel > 4) {
      refreshVisibleMap(event);
    }
  }

  function refreshVisibleMap(event) {
    clearInterval(interval);
    interval = setTimeout(function() {
      $.getJSON('/users', getCurrentRectangle(), function(users) {
        addPushpins(users);
      });
    }, 800);
  }
  
  function getCurrentRectangle() {
    var view = map.GetMapView();
    return {
      tl: [view.TopLeftLatLong.Latitude, view.TopLeftLatLong.Longitude],
      br: [view.BottomRightLatLong.Latitude, view.BottomRightLatLong.Longitude]
    };
  }

  // ===========
  // = Cookies =
  // ===========
  function getLatLongFromCookie() {
    if (!$.cookie('navid-map-center')) {
      return null;
    }

    var center = $.cookie('navid-map-center').split(',');
    return new VELatLong(parseFloat(center[0]), parseFloat(center[1]));
  }

  function setCookieCenter() {
    $.cookie( 'navid-map-center', [map.GetCenter().Latitude, map.GetCenter().Longitude].join(',') );
  }

  function getCookieStyle() {
    return $.cookie('navid-map-style');
  }

  function setCookieStyle() {
    $.cookie('navid-map-style', map.GetMapStyle());
  }

  function getCookieZoom() {
    return parseInt($.cookie('navid-map-zoom'), 10);
  }

  function setCookieZoom(event) {
    $.cookie('navid-map-zoom', map.GetZoomLevel());
  }

  // Just a helper function for debugging purposes.
  function resetCookies() {
    $.cookie('navid-map-center', null);
    $.cookie('navid-map-zoom', null);
    $.cookie('navid-map-style', null);
  }
})();
