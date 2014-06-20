'use strict';

/*global google */

angular.module('findMeApp')
  .service('Googlemap', function Googlemap($cookieStore) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var map;
    var markers = [];
    var paths = {};

    var mapIsInitialized = false;    
    var lastLocation = new google.maps.LatLng(52.520816, 13.410186); // berlin
    var latlngbounds = new google.maps.LatLngBounds();

    var lastPosition = $cookieStore.get('lastPosition');
    if (lastPosition && lastPosition.coords) {
      lastLocation = new google.maps.LatLng(lastPosition.coords.latitude, lastPosition.coords.longitude);
    }
    
    function centerMap(position) {
      if (!mapIsInitialized) {
	if (!(position && position.coords)) {
	  return;
	}
	mapIsInitialized = true;
//	console.log('map setCenter');
	var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	map.panTo(pos);
	$cookieStore.put('lastPosition', position);
      }
    }
    
    // Sets the map on all markers in the array.
    function setAllMap(map) {
      for (var i = 0; i < markers.length; i++) {
	markers[i].setMap(map);
      }
    }
    
    // Removes the markers from the map, but keeps them in the array.
    function clearMarkers() {
      setAllMap(null);
    }
    
    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
      clearMarkers();
      markers = [];
    }

    // Deletes the specified marker
    function deleteMarker(marker) {
      // delete the path associated with this marker first, if available
      if (paths[marker.title]) {
	paths[marker.title].setMap(null);
	delete paths[marker.title];
      }
      var index = markers.indexOf(marker);
      if (index !== -1) {
	marker.setMap(null);
	markers.splice(index,1);
      }
    }
    
    function mapInit() {
      var mapOptions = {
	streetViewControl: false,
	panControl: false,
	zoomControl: false,
	center: lastLocation,
	zoom: 14,
	mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
    }

    function getMarkerIcon(heading) {
      return {
	path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
	fillOpacity: 0.5,
	strokeColor: '0099cc',
	strokeOpacity: 1.0,
	fillColor: '0099cc',
	strokeWeight: 1.5, 
	scale: 5, //pixels
	rotation: heading
      };
    }

    var ownPosition;

    var infoWindow = new google.maps.InfoWindow();
    function createMarker(nickname, coords, isOwnLocation) {
      if (!coords) {
	return;
      }
      var pos = new google.maps.LatLng(coords.latitude, coords.longitude);

      if (isOwnLocation) {
	ownPosition = pos;
      }

      var marker = new google.maps.Marker({
        map: map,
        position: pos,
        title: isOwnLocation ? 'My location' : nickname,
	draggable: false,
	animation: google.maps.Animation.DROP,
	icon: isOwnLocation ? getMarkerIcon(0) : ''
      });
      google.maps.event.addListener(marker, 'click', function(){
        infoWindow.setContent('<h4>' + marker.title + '</h4>');
        infoWindow.open(map, marker);
      });
      latlngbounds.extend(pos);
      if (markers.length) {
	map.fitBounds(latlngbounds);
      }
      markers.push(marker);
      return marker;
    }

    function distanceTo(coords) {
      if (!ownPosition) { return; }
      return google.maps.geometry.spherical.computeDistanceBetween(
	ownPosition,
	new google.maps.LatLng(coords.latitude, coords.longitude));
    }

    function updatePath(marker, isOwnLocation) {
      if (!paths[marker.title]) { // create a new path
	var path = new Array(marker.position);
	paths[marker.title] = new google.maps.Polyline({
	  path: path,
	  geodesic: true,
	  strokeColor: isOwnLocation ? '0099cc' : 'ff0000',
	  strokeOpacity: 1,
	  strokeWeight: 2
	});
	paths[marker.title].setMap(map);
      } else {
	var i = paths[marker.title].getPath().getLength();
	if (i) { // at least one element available
	  i--; // compute the index val
	  var lastPathPoint = paths[marker.title].getPath().getAt(i);
	  if (google.maps.geometry.spherical.computeDistanceBetween(
	    lastPathPoint, marker.position) > 3) {
	    // only if the distance between the last point of the path and the
	    // current position is > 3m, THEN update the path
	    paths[marker.title].getPath().push(marker.position);
	  }
	}
      }
    }

    // exported functions for this service
    this.init = mapInit;
    this.centerMap = centerMap;
    this.createMarker = createMarker;
    this.deleteMarkers = deleteMarkers;
    this.deleteMarker = deleteMarker;
    this.panTo = function(coords) {
      if (!coords) { return; }
      map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
    };
    
    this.distanceTo = distanceTo;

    this.updatePosition = function(marker, coords, isOwnLocation) {
      var pos = new google.maps.LatLng(coords.latitude, coords.longitude);
      var heading = google.maps.geometry.spherical.computeHeading(
	marker.position,
	pos);

      if (isOwnLocation) {
	ownPosition = pos;
	marker.setIcon(getMarkerIcon(heading));
      }
      
      marker.setPosition(pos);      
      updatePath(marker, isOwnLocation);
    };
    
  });
