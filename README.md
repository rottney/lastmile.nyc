# lastmile.nyc - Solving the last mile in style
<img width="1440" alt="lastmile_screen" src="https://github.com/user-attachments/assets/4ad4cf1f-58fe-443f-9f81-d90a8d1e74b4">

## Summary
lastmile.nyc is a navigation web app focused on multimodal routing, written in Vanilla JS. While designed for use in and around New York City, it will work for basic navigation in any location, with the exception of bikeshare mode. Note that this application does **not** provide driving directions, as it is common to not own a car in NYC!

This project is one of two primary portfolio pieces I created at [The Recurse Center](https://www.recurse.com/) in Brooklyn during the Fall of 2024. The site can be accessed at [rottney.github.io/lastmile.nyc](https://rottney.github.io/lastmile.nyc/).

## Usage
**Required parameters:**
* Origin
* Destination
* **At least** one of:
  * Show transit directions
  * Show bikeshare directions
  * Show walking directions
  * Show rideshare directions

***Note: to set direction type(s), the settings must be expanded by clicking the gear icon in the top-right corner.***

**Optional parameters:**
* Walking threshold: maximum distance you are willing to walk (units can be toggled between km / mi)
* Sort results by soonest arrival or shortest duration (default is soonest arrival)
* Departure or arrival time (note that no results will display if it is not possible to arrive at destination by specified arrival time)

## Technologies Used
lastmile.nyc is made possible with the following external technologies:
* UI map rendering: [Leaflet](https://leafletjs.com/)
* Trip routing: [TripGo Routing API](https://developer.tripgo.com/)
* Bikeshare-specific routing: [Citi Bike System Data](https://gbfs.citibikenyc.com/gbfs/2.3/gbfs.json)
* Address lookup: [Geoapify Geocoding API](https://www.geoapify.com/geocoding-api/)
* Web hosting: [GitHub Pages](https://pages.github.com/)

## Challenges
The TripGo Routing API is quite outdated. The "shared micromobility" mode only supports Lime, which does not exist in New York - this is why I had to separately use the Citi Bike data. My workaround was to use TripGo to find regular biking directions, starting from the nearest Citi Bike station (from the origin) with available bikes, and going to the nearest Citi Bike station (to the destination) with available docks.

The pricing information returned by the TripGo API is outdated; MTA fares have been increased from $2.75 to $2.90. Additionally, the API incorrectly assumes that each subway line per trip incurs an additional cost; this is not true [per the MTA website](https://new.mta.info/fares). **This is a known issue that will be addressed in a future release.**

## Feedback?
If you notice any issues while using the app, please feel free to open a bug report using the [Issues](https://github.com/rottney/lastmile.nyc/issues) tab and I will get it fixed as quickly as possible.

Contributions welcome! Please reach out at rottney123@gmail.com if interested and I will be happy to get you onboarded. 🙂
