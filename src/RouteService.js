/*
* routeService provides functions to hit SkedGo server and get data from cache.
*
* */

export const routeService = (function () {

    let templatesCache = [];
    let globali = 0;
    let numModesToSearch = 0;
    /*
    const transportModes = ["pt_pub", "ps_tax", "me_car", "me_mot", "cy_bic", "wa_wal", "ps_tax_MYDRIVER", "ps_tnc_UBER",
        "me_car-r_SwiftFleet", "me_car-p_BlaBlaCar", "cy_bic-s"];
    */
    const baseURL = "https://api.tripgo.com/v1/routing.json?v=11&locale=en";

    function getUrl(from, to, mode){
        let url = baseURL +  mode;
        let routeUrl = url +"&from=("+from.lat+","+from.lng+")&to=("+to.lat+","+to.lng+")";

        if (sessionStorage.getItem("depart") !== null) {
            routeUrl += "&departAfter=" + sessionStorage.getItem("depart");
        }
        else {  // still have depart after "now"
            routeUrl += "&departAfter=" + Math.floor(Date.now() / 1000);
        }

        if (sessionStorage.getItem("arrive") !== null) {
            routeUrl += "&arriveBefore=" + sessionStorage.getItem("arrive");
        }

        return routeUrl;
    }

    function getDistance(lat, lng, currLat, currLng) {
        return Math.abs(lat - currLat) + Math.abs(lng - currLng);
    }

    // find closest citi bike station with open bikes or docks
    function findClosestStation(stations, statuses, latLng, fromOrTo) {
        const lat = latLng.lat;
        const lng = latLng.lng;
        
        let closestStation = stations[0];
        let minDistance = 1000; // initialize to high value

        for (let station of stations) {
            const currLat = station.lat;
            const currLng = station.lon;

            const currDistance = getDistance(lat, lng, currLat, currLng);

            if (currDistance < minDistance) {
                const stationId = station.station_id;
                const myStation = statuses.filter((el) => el.station_id === stationId)[0];
                
                // check station status... make sure there are bikes/docks available
                if (fromOrTo === "from" && myStation.num_bikes_available > 0) {
                    minDistance = currDistance;
                    closestStation = station;
                }
                if (fromOrTo === "to" && myStation.num_docks_available > 0) {
                    minDistance = currDistance;
                    closestStation = station;
                }
            }
        }

        return closestStation;
    }

    function bikeshareRoutes(from, to, stations, statuses) {
        const fromStation = findClosestStation(stations, statuses, from, "from");
        const toStation = findClosestStation(stations, statuses, to, "to");

        return [fromStation, toStation];
    }

    function getRoutes(url, apiKey, requirements) {
        //console.log(url);
        // make the request to SkedGo backend
        $.ajax({
            url         : url,
            dataType    : "json",
            beforeSend: function(xhr){
                xhr.setRequestHeader('X-TripGo-Key', apiKey);
            },
            success     : function(result) {
                if (result.error !== undefined) {
                    L.tripgoRouting.mapLayer.getMessenger().info(result.error);
                }
                if(requirements <= 1)
                    L.tripgoRouting.mapLayer.getMessenger().hideMessage();

                requirements --;
                if (L.tripgoRouting.has(result, 'groups')) {
                    try {
                        templatesCache = L.tripgoRouting.util.parseTemplates(result.segmentTemplates);
                        let trips = L.tripgoRouting.util.parseTrips(result.groups);
                        L.tripgoRouting.tripWidget.initialize();
                        success(trips);
                    }
                    catch (err) {
                        console.log("ERROR: " + err.message);
                    }
                }//else{
                    // check if server gets results
                    if (requirements === 0 && !L.tripgoRouting.tripWidget.isVisible()) {
                        L.tripgoRouting.mapLayer.clearMarkers();
                        L.tripgoRouting.mapLayer.getMessenger().error("No routes found");
                    }
                //}
            },

            error       : function(data){
                requirements --;
                // if server returns an error, will inform the user about that
                if (requirements === 0){
                    L.tripgoRouting.mapLayer.clearMarkers();
                }
                L.tripgoRouting.mapLayer.getMessenger().hideMessage();
                L.tripgoRouting.mapLayer.getMessenger().error("service-not-available, The routing service is currently not available, <br> please check your API key or try again later" );
            },

            complete    : function() {
                numModesToSearch--;
                if (numModesToSearch === 0) {
                    draw();
                    numModesToSearch = 0;
                }
            }
        });
    }

    function isBelowThreshold(result) {
        const walkingThreshold = localStorage.getItem("walkingThreshold");
        let totalWalking = 0;

        for (let part of result) {
            for (let segment of part.segments) {
                if (segment.modeIdentifier === "wa_wal") {
                    totalWalking += segment.meters;
                }
            }
        }

        if (totalWalking > walkingThreshold) {
            return false;
        }
        return true;
    }

    let routes = [];

    function sortResults(sortType) {
        if (sortType === "arrive") {
            // order the routes by arrival time
            routes.sort((a, b) => {
                if (a.arrive < b.arrive) {
                    return -1;
                }
                else if (a.arrive > b.arrive) {
                    return 1;
                }
                return 0;   // they are the same.. should we remove duplicates?
            });
        }
        else {
            routes.sort((a, b) => {
                if (a.arrive - a.depart < b.arrive - b.depart) {
                    return -1;
                }
                else if (a.arrive - a.depart > b.arrive - b.depart) {
                    return 1;
                }
                return 0;
            });
        }
    }

    function draw() {
        sortResults(localStorage.getItem("sorttype"));

        // then draw
        routes.forEach(function(element) {
            L.tripgoRouting.tripWidget.addTrip(element, "trip" + globali);
            globali++;
        });

        if(!L.tripgoRouting.mapLayer.showingTrip()) {
            routes[0].drawTrip(L.tripgoRouting.mapLayer.getMap());
        }
    }

    function success(result) {
        let belowThreshold = true;

        if (localStorage.getItem("walkingThreshold") !== null) {
            belowThreshold = isBelowThreshold(result);
        }

        if (belowThreshold === true) {
            result.forEach(function(element) {
                routes.push(element);
            });
        }
    };

    return {
        resetGlobali : function() {
            globali = 0;
        },

        /*
        * Param: hashCode, value which is provided from server. It identifies a template.
        * Return: trip template.
        * */
        getTemplate : function(hashCode) {
            return templatesCache[hashCode];
        },

        /*
        * Params:
        *       tripgoApiKey: key provided by SkedGo server
        *       from: leaflet latlng
        *       to: leaflet latlng
        * */
        route : function(tripgoApiKey, from, to, transportModes, stations, statuses){
            routes = [];
            let requirements = transportModes.length + 1;
            numModesToSearch = transportModes.length;
            if (numModesToSearch >= 1) {
                numModesToSearch += 1;
            }

            if(L.tripgoRouting.validLatLng(from) && L.tripgoRouting.validLatLng(to)){
                L.tripgoRouting.mapLayer.getMessenger().info("getting routes form SkedGo server ...");
                let multimodal =  "";
                transportModes.forEach(function (mode) {
                    //if (mode === "me_mic-s") {
                    if (mode === "me_mic_bic") {
                        const fromTo = bikeshareRoutes(from, to, stations, statuses);
                        const fromStation = fromTo[0];
                        const toStation = fromTo[1];
                        // API requires all lat and lngs have same # of sig digits
                        const fromLat = Number(fromStation.lat.toPrecision(9));
                        const fromLng = Number(fromStation.lon.toPrecision(9));
                        const toLat = Number(toStation.lat.toPrecision(9));
                        const toLng = Number(toStation.lon.toPrecision(9));
                        from = L.latLng(fromLat, fromLng);
                        to = L.latLng(toLat, toLng);
                        // use bicycle icon...
                        //L.marker(from).addTo(L.tripgoRouting.mapLayer.getMap());
                        //L.marker(to).addTo(L.tripgoRouting.mapLayer.getMap());
                    }
                    let url = getUrl(from, to, "&modes="+mode);

                    multimodal = multimodal + "&modes=" + mode;
                    getRoutes(url, tripgoApiKey, requirements--);
                });
                if (transportModes.length > 1) {
                    getRoutes(getUrl(from, to, multimodal), tripgoApiKey, requirements--);
                }
                else {
                    requirements--;
                    if(requirements <= 1)
                        L.tripgoRouting.mapLayer.getMessenger().hideMessage();
                }
            }else{
                console.error("Malformed coordinates");
            }
        },
    }
})();
