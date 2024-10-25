const lirrLines = [
    "Babylon Branch",
    "City Terminal Zone",
    "Far Rockaway Branch",
    "Hempstead Branch",
    "Long Beach Branch",
    "Montauk Branch",
    "Oyster Bay Branch",
    "Port Jefferson Branch",
    "Port Washington Branch",
    "Ronkonkoma Branch",
    "West Hempstead Branch",
];

const metroNorthLines = [
    "Harlem",
    "Hudson",
    "New Haven",
];

// do I need these?
const njTransitLines = [
    
];

const amtrakLines = [
    "Acela",
    "Keystone Service",
    "Northeast Regional",
    // maybe more
];


function convertTo12HrClock(time) {
    let hour = time.slice(0, 2);
    const min = time.slice(-2);
    let amPm = "";

    if (hour === "12") {
        amPm = " PM";
    }
    else if (hour < "12") {
        amPm = " AM";
    }
    else {
        hour -= "12";
        amPm = " PM"
    }

    return hour + ":" + min + amPm;
}


export const tripWidget = (function () {
    // should this be moved out of export?
    let directions = [];


    function span(text, className){
        let span = L.DomUtil.create("span");
        span.className = className;
        span.innerHTML = text;
        return span;
    }

    function div(className){
        let div =  L.DomUtil.create("div");
        div.className = className;
        return div;
    }

    function img(src, className){
        let img =  L.DomUtil.create("img");
        img.className = className;
        img.src = src;
        return img;
    }

    function createTripLine (trip, id) {
        let tripline = div("tripLine");
        tripline.id = id;

        L.DomEvent.on(tripline, "mouseover", function () {
                tripline.style.backgroundColor = '#f8f7f7';
                if (L.tripgoRouting.mapLayer.getTripDisplaying() !== undefined)
                    L.tripgoRouting.mapLayer.getTripDisplaying().removeFromMap(L.tripgoRouting.mapLayer.getMap());

                trip.drawTrip(L.tripgoRouting.mapLayer.getMap());
                L.tripgoRouting.mapLayer.setTripDisplaying(trip);
            }
        );

        L.DomEvent.on(tripline, "mouseout", function () {
                tripline.style.backgroundColor = '';
            }
        );

        return tripline;
    }


    function timesWidget(trip) {
        let times = div("");

        let arriveTime = convertTo12HrClock(trip.arriveTime);

        let duration = span(trip.getDuration, "tripDuration");

        // render text red if actual arrive time is after desired arrive time
        if (
            sessionStorage.getItem("arrive") !== null && 
            parseInt(sessionStorage.getItem("arrive")) < trip.arrive
        ) {
            arriveTime = `<span style="color:Red;">` + arriveTime + `</span>`;
        }
        let arrive = span(" (arrive " + arriveTime + ")", "tripArrive");

        times.appendChild(duration);
        times.appendChild(arrive);
        return times;
    }

    function getServiceName(segment) {
        if (segment.serviceNumber !== undefined)
            return segment.serviceNumber;
        else if (lirrLines.includes(segment.serviceName))
            return "LIRR";
        else if (metroNorthLines.includes(segment.serviceName))
            return "Metro North";
        else if (njTransitLines.includes(segment.serviceName))
            return "NJ Transit";
        else if (amtrakLines.includes(segment.serviceName))
            return "Amtrak";
        else return ""; // must not be public transit
    }

    function parseSegment(segment) {
        if (segment.from !== undefined) {
            const mode = segment.modeInfo.alt;
            const serviceNumber = getServiceName(segment);
            const from = (segment.from.address === undefined) ? segment.from.lat + ", " + segment.from.lng : segment.from.address;
            const to = (segment.to.address === undefined) ? segment.to.lat + ", " + segment.to.lng : segment.to.address;

            if (serviceNumber === "") {
                return mode + " from " + from + " to " + to;
            }
            else {
                return "Take the " + serviceNumber + " " + mode.toLowerCase() + " from " + from + " to " + to;
            }
        }
        else {
            return "";
        }
    }

    function tripDetailsWidget(trip){
        let tripDetails = div("tripDetails");
        let direction = [];
        for(let i=0; i<trip.segments.length; i++){
            let segment = trip.segments[i];

            if (parseSegment(segment) !== "") {
                direction.push(parseSegment(segment));
            }

            if(segment.modeInfo.identifier !== undefined){
                tripDetails.appendChild(segmentDetailsWidget(segment));
            }
        }

        directions.push(direction);
        
        tripDetails.appendChild(addButton(directions.length - 1));
        return tripDetails;
    }

    // consider refactoring lol
    function getDirections(i) {
        const tripDiv = document.getElementById("trip" + i);
        const dirList = div("dirlist");
        let s = "<ul>";
        directions[i].forEach((element) => s += "<li>" + element + "</li>");
        s += "</ul>";

        const numChildNodes = tripDiv.childNodes.length;
        if (numChildNodes === 3) {
            dirList.innerHTML = s;
            tripDiv.appendChild(dirList);
        }
        else if (numChildNodes === 4) {
            const lastChild = tripDiv.lastElementChild;
            tripDiv.removeChild(lastChild);
        }
    }

    function eventListener(e) {
        let id = e.target.id.slice(-1);
        getDirections(id);
    }

    function addButton(i) {
        let btn = div("inline");
        btn.innerHTML = '<button type="button" id="detailsBtn' + i + '">Details</button>';
        btn.addEventListener("click", eventListener);
        return btn;
    }

    function segmentDetailsWidget(segment){
        let segmentDetails = div('inline');
        let htmlIcon;

        if(L.tripgoRouting.has(segment.modeInfo, "remoteIcon")){
         htmlIcon = img(L.tripgoRouting.util.getTransportIconSVG(segment.modeInfo.remoteIcon, true), "icon");
         segmentDetails.appendChild(htmlIcon);
        }else{
            let path = L.tripgoRouting.util.getTransportIconSVG(segment.modeInfo.localIcon, false);
            if (path !== undefined){
                htmlIcon = img(path, "icon");
                segmentDetails.appendChild(htmlIcon);
            }
        }

        if(segment.modeIdentifier !== undefined){
            let text = div("iconText");
            if(segment.modeIdentifier === "pt_pub") {
                const service = getServiceName(segment);
                //text.innerHTML = "<span style='color:black;'>" + segment.serviceNumber + "</span>" + "<br>" + L.tripgoRouting.util.getTime(segment.startTime);
                text.innerHTML = "<span style='color:black;'>" + service + "</span>" + "<br>" + L.tripgoRouting.util.getTime(segment.startTime);
            }
            else{
                if(segment.getDistanceStringMetric !== undefined) {
                    const distance = localStorage.getItem("distanceunit") === "km" ? segment.getDistanceStringMetric : segment.getDistanceStringImperial;
                    text.innerHTML = distance;
                }
            }

            segmentDetails.appendChild(text);
        }
        return segmentDetails;
    }

    /*
    Per MTA website:
        "You get one free transfer within two hours of paying your fare. 
        You can transfer from subway to bus, bus to subway, or bus to bus.
        "
    Subway fare: $2.90
        * free transfers _within system_
    Bus fare: $2.90
    Ferry fare: $4.50
    */
   /*
    function computeCost(trip) {
        console.log(trip);
        const ptSegments = trip["segments"].filter((segment) => segment.modeIdentifier == "pt_pub");
        console.log(ptSegments);

        let numSubwaySegments = 0;
        let subwaySegments = [];
        let numBusSegments = 0;
        let numFerrySegments = 0;
        for (let segment of ptSegments) {
            let mode = segment.modeInfo.alt;
            if (mode === "Subway") {
                numSubwaySegments++;
                subwaySegments.push(segment);
            }
            else if (mode === "Bus")
                numBusSegments++;
            else if (mode === "Ferry")
                numFerrySegments++;
            else
                console.log(`unhandled mode: ${mode}`)
        }
        
        let cost = trip["moneyCost"];


        return "implementMe ";
    }
    */

    /*
    How "moneyCost" is calculated in TripGo (it is wrong):
        * Subway: $2.75 *per line*
        * Subway + bus: $2.75
        * Bus: $2.75 (unlimited lines)
        * Anything with a ferry - undefined (I think?)
    */
    function moreDataWidget(trip){
        let moreData = div("more");

        let moneyCost = "";
        if(trip.moneyCost !== undefined && trip.moneyCost !== 0)
            moneyCost = trip.currencySymbol + trip.moneyCost + " - ";
        else
            if(trip.moneyCost === 0)
                moneyCost = "Free - ";
        //const moneyCost = computeCost(trip);

        let carbonCost;
        if(trip.carbonCost !== undefined)
            carbonCost = trip.carbonCost + "kg CO<SUB>2</SUB> - ";
        else
            carbonCost = "NO CO<SUB>2</SUB> - ";

        let caloriesCost;
        if(trip.caloriesCost !== undefined)
            caloriesCost = trip.caloriesCost + " calories";
        else
            caloriesCost = "NO calories";

        moreData.innerHTML = moneyCost  + carbonCost +  caloriesCost;
        return moreData;
    }


    return {
        initialize : function(){
            if(! this.isVisible()) {
                this.getWidget().style.display = "block";
                this.getWidget().style.height = window.innerHeight;

                L.tripgoRouting.mapLayer.mapResize(window.innerWidth - this.getWidth(), L.tripgoRouting.mapLayer.height);
            }
        },

        addTrip : function(trip, id){
            let tripLine = createTripLine(trip,id);
            let times = timesWidget(trip);
            tripLine.appendChild(times);
            tripLine.appendChild(tripDetailsWidget(trip));
            tripLine.appendChild(moreDataWidget(trip));

            this.getWidget().appendChild(tripLine);
        },


        getWidget : function(){
            return L.DomUtil.get("selectorPanel");
        },

        getWidth : function () {
            if(this.isVisible() && !L.tripgoRouting.mapLayer.selectorPanelIsFloat()) return  400;
            else return 0;
        },

        isVisible: function () {
            return this.getWidget().style.display  === "block";
        },

        clearWidget: function () {
            directions = [];
            const widget = document.getElementById("selectorPanel");
            while (widget.firstChild) {
                widget.removeChild(widget.firstChild);
            }
        },
    }
})();
