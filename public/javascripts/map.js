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
      map.HideDashboard();
      map.ClearInfoBoxStyles();
      map.SetMapStyle(getCookieStyle() || VEMapStyle.Road);
      
      showMiniMapRightBottom();
      hideMiniMapResizeIcon();
      $(window).resize(showMiniMapRightBottom);
      
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
      map.Find(
        null,  // what
        where, // where
        VEFindType.Businesses, // findType
        null,  // shapeLayer
        null,  // startIndex
        15,  // numberOfResults
        true,  // showResults
        null,  // createResults
        false,  // useDefaultDisambiguation
        true,  // setBestMapView
        function(layer, resultsArray, places) {
          if (places && places.length > 1) {
            console.log('Multiple places');
            refreshVisibleMap();
          } else if (places && places.length == 1) {
            console.log('One place');
            refreshVisibleMap();
          } else {
            console.log('No place');
          }
        }
      );
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
    if (users.length == 0) { return; }

    var newShapes = [];
    var shapeLayer = new VEShapeLayer();
    $(users).each(function(i, user) { newShapes.push(createPushpin(user)); });
    map.DeleteAllShapeLayers();
    map.AddShapeLayer(shapeLayer);
    shapeLayer.AddShape(newShapes);
  }

  function createPushpin(user) {
    var latLong = new VELatLong(user.latitude, user.longitude);
    var pin = new VEShape(VEShapeType.Pushpin, latLong);
    var klass = user.role == ADVERTISER ? 'icon-a' : 'icon-p';
    pin.SetCustomIcon('<div class="'+klass+' "' + 'data-user-id="'+user.id+'" ' + 'data-user-type="'+user.role+'" ' + 'data-user-category_id="'+user.category_id+'"></div>');
    pin.SetMinZoomLevel(DEFAULT_ZOOM);
    return pin;
  }
  
  function showInfoBox(pin) {
    map.ShowInfoBox(pin);
    fixInfoBoxLayout();
  }
  
  // ================
  // = Layout Fixes =
  // ================
  function removeUnusedControls() {
    $('#MSVE_navAction_View3DMapMode,\
       #MSVE_navAction_FlatlandMapMode,\
       #MSVE_navAction_separator0,\
       #MSVE_navAction_ObliqueMapView').remove();
  }
  
  function fixInfoBoxLayout() {
    var left = null;
    
    var infoBox = $('.customInfoBox-with-leftBeak');
    if (infoBox) {
      left = parseInt(infoBox.css('left'), 10);
      infoBox.css({ left: left + 36 });
    }
    
    infoBox = $('.customInfoBox-with-rightBeak');
    if (infoBox) {
      left = parseInt(infoBox.css('left'), 10);
      infoBox.css({ left: left - 19 });
    }
    
    // Insert a more flexible dropshadow.
    if ( $('.realInfoBox-shadow').length == 0 )
      $('.customInfoBox-shadow').after($('<div class="realInfoBox-shadow">'));
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
        showInfoBox(pin);
      } else {
        var icon = $(pin.GetCustomIcon());
        var userID = icon.attr('data-user-id');
        $.get('/users/'+userID, function(html) {
          pin.SetDescription(html);
          showInfoBox(pin);
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
      $.getJSON('/users.json', getCurrentRectangle(), function(users) {
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
    if (!$.cookie('bing-map-center')) {
      return null;
    }

    var center = $.cookie('bing-map-center').split(',');
    return new VELatLong(parseFloat(center[0]), parseFloat(center[1]));
  }

  function setCookieCenter() {
    $.cookie( 'bing-map-center', [map.GetCenter().Latitude, map.GetCenter().Longitude].join(',') );
  }

  function getCookieStyle() {
    return $.cookie('bing-map-style');
  }

  function setCookieStyle() {
    $.cookie('bing-map-style', map.GetMapStyle());
  }

  function getCookieZoom() {
    return parseInt($.cookie('bing-map-zoom'), 10);
  }

  function setCookieZoom(event) {
    $.cookie('bing-map-zoom', map.GetZoomLevel());
  }

  // Just a helper function for debugging purposes.
  function resetCookies() {
    $.cookie('bing-map-center', null);
    $.cookie('bing-map-zoom', null);
    $.cookie('bing-map-style', null);
  }
  
  // ===========
  // = Minimap =
  // ===========
  function showMiniMapRightBottom() {
    var pixelPosition = latLongToPixel(map.GetMapView().BottomRightLatLong);
    map.ShowMiniMap(pixelPosition.x - 150, pixelPosition.y - 150);
  }
  
  function hideMiniMapResizeIcon() {
    $('#MSVE_minimap_resize').hide();
  }
  
  function latLongToPixel(latLong) {
    var pixelPoint = map.LatLongToPixel(latLong);
    pixelPoint.x = parseInt(pixelPoint.x, 10);
    pixelPoint.y = parseInt(pixelPoint.y, 10);
    return pixelPoint;
  }
})();

