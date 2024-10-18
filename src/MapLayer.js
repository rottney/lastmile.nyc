import { Messenger } from "../src/Messenger.js";
import { tripWidget } from "./TripWidget.js";

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

    function setModes() {
        let modes = [];

        if (localStorage.getItem("transit") !== null && localStorage.getItem("transit") === "true") {
            modes.push("pt_pub");
        }
        if (localStorage.getItem("bikeshare") !== null && localStorage.getItem("bikeshare") === "true") {
            //modes.push("me_mic-s");
            modes.push("me_mic_bic");
        }
        if (localStorage.getItem("walking") !== null && localStorage.getItem("walking") === "true") {
            modes.push("wa_wal");
        }
        if (localStorage.getItem("rideshare") !== null && localStorage.getItem("rideshare") === "true") {
            modes.push("ps_tax");
            modes.push("ps_tnc")
        }

        return modes;
    };


    return {
        initialize : function(options){
            mapId = options.mapId;
            map = L.map(mapId).setView([options.mapCenter.lat,options.mapCenter.lng], 11);
            setOSMTile();

            L.tripgoRouting.mapLayer.mapResize(window.innerWidth, window.innerHeight);

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

        createMarker : function(where, lat, lng, stations, statuses){
            let latlng = L.latLng(lat, lng);
            if(stops[where] !== undefined) {
                map.removeLayer(stops[where]);
            }

            let iconUrl = "resources/map/flag-"+where+".png" ;

            let icon = L.icon({iconUrl: iconUrl, iconSize: [33, 37], iconAnchor: [16, 37]});
            let marker = L.marker();
            marker
                .setLatLng(latlng)
                .setIcon(icon)
                .addTo(map);
            marker.dragging.enable();

            stops[where] = marker;

            if(stops.from !== undefined && stops.to !== undefined){
                L.tripgoRouting.tripWidget.clearWidget();

                if (this.getTripDisplaying() !== null) {
                    this.getTripDisplaying().removeFromMap(map);
                }

                let from = stops.from.getLatLng();
                let to = stops.to.getLatLng();

                const modes = setModes();
                
                if (modes.length === 0) {
                    this.getMessenger().info("No modes specified");
                }
                else {
                    L.tripgoRouting.routeService.resetGlobali();
                    L.tripgoRouting.routeService.route(tripgoApiKey, from, to, modes, stations, statuses);
                }
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

        // consider renaming
        removeMarker : function(toOrFrom, value) {
            if (value === "") {
                map.removeLayer(stops[toOrFrom]);
                delete stops[toOrFrom];
                tripWidget.clearWidget();
                this.getTripDisplaying().removeFromMap(map);
                this.setTripDisplaying(null);
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
