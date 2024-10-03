import { Messenger } from "../src/Messenger.js";

export const mapLayer = (function() {

    let map = null;
    let mapId = "";
    let stops = [];
    let tripDisplaying  = null;
    let messenger = null;
    let tripgoApiKey = null;
    let floatPanel = false;


    function setOSMTile() {
        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | ' + 
                '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    };


    return {
        initialize : function(options){
            mapId = options.mapId;
            map = L.map(mapId).setView([options.mapCenter.lat,options.mapCenter.lng], 11);
            setOSMTile();

            this.mapResize(window.innerWidth, window.innerHeight);

            tripgoApiKey = options.tripgoApiKey;
            floatPanel = options.floatPanel;

            let tripsPanel = L.DomUtil.create("div");
            tripsPanel.id = "selectorPanel";

            if(floatPanel)
                tripsPanel.className = "selectorFloatPanel";
            else
                tripsPanel.className = "selectorPanel";

            document.body.insertBefore(tripsPanel, L.DomUtil.get(mapId));

            L.DomEvent.on(window, "resize",function () {
                L.tripgoRouting.mapLayer.mapResize((window.innerWidth - L.tripgoRouting.tripWidget.getWidth()), window.innerHeight);
                L.tripgoRouting.tripWidget.getWidget().style.height = window.innerHeight + "px";
            });
        },

        getMapId : function(){
            return mapId;
        },

        getMap : function(){
            return map;
        },

        getTripDisplaying : function () {
            return tripDisplaying;
        },

        setTripDisplaying : function (displaying) {
            tripDisplaying = displaying;
        },


        mapResize : function(width, height){
            let element = L.DomUtil.get(this.getMapId());
            element.style.width = width + "px";
            element.style.height = height + "px";
            map.invalidateSize();
        },

        getMessenger : function(){
            if(messenger == null)
                messenger = new Messenger();

            return messenger;
        },

        createMarker : function(where, lat, lng){
            map.closePopup();
            let latlng = L.latLng(lat, lng);
            if(stops[where] !== undefined) {
                map.removeLayer(stops[where]);
            }

            let iconUrl = "resources/map/map-pin-"+where+".svg" ;
            let icon = L.icon({iconUrl: iconUrl, iconSize: [33, 37], iconAnchor: [16, 37]});
            let marker = L.marker();
            marker
                .setLatLng(latlng)
                .setIcon(icon)
                .addTo(map);
            marker.dragging.enable();

            stops[where] = marker;

            if(stops.from !== undefined && stops.to !== undefined){
                let from = stops.from.getLatLng();
                let to = stops.to.getLatLng();

                fetch("http://localhost:5000/getmodes")
                    .then((response) => response.json())
                    .then((json) => L.tripgoRouting.routeService.route(tripgoApiKey, from, to, json));
            }
        },

        clearMap : function () {
            location.reload();
        },

        clearMarkers : function () {
            if(stops.from !== undefined && stops.to !== undefined){
                map.removeLayer(stops.from);
                map.removeLayer(stops.to);
                stops = [];
            }

        },

        showingTrip : function () {
            return tripDisplaying  !== null;
        },

        selectorPanelIsFloat : function(){
            return floatPanel;
        }
    };
})();
