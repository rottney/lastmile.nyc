//import L from "/Users/ryan/Library/Caches/typescript/5.5/node_modules/@types/leaflet/index.d.ts";

export const tripgoRouting = {
    has: function (obj, key) {
        return obj != null && hasOwnProperty.call(obj, key);
    },

    isFunction: function (obj) {
        return typeof obj == 'function' || false;
    },

    contains: function (array, item) {
        return array.indexOf(item) > -1;
    },

    validLatLng: function (latLng) {
        return latLng !== undefined && latLng.lat !== undefined && latLng.lng !== undefined;
    }
};

// If you want to automatically attach the plugin to Leaflet's global `L` object
if (typeof window !== 'undefined' && window.L) {
    window.L.tripgoRouting = tripgoRouting;
}
