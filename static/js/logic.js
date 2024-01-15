// Constants for fetching and displaying earthquake data
const EARTHQUAKE_DATA_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson";
const DEPTH_COLORS = ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026'];
const DEPTH_THRESHOLDS = [10, 30, 50, 70, 90];

// Fetch and process earthquake data
d3.json(EARTHQUAKE_DATA_URL).then(data => createMap(data.features));

// Create and configure the map with earthquake data
function createMap(earthquakeData) {
    // Base map layers
    const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });
    const topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'
    });

    // Overlay layer for earthquakes
    const earthquakeLayer = L.geoJSON(earthquakeData, {
        pointToLayer: createCircleMarker,
        onEachFeature: (feature, layer) => layer.bindPopup(createPopupContent(feature))
    });

    // Initialize and configure the map
    const map = L.map("map", {
        center: [37.09, -95.71],
        zoom: 5,
        layers: [streetMap, earthquakeLayer]
    });
    L.control.layers({ "Street Map": streetMap, "Topographic Map": topoMap }, { "Seismic Activity": earthquakeLayer }, { collapsed: false }).addTo(map);
    createLegend().addTo(map);
}

// Function to create a popup content for an earthquake feature
function createPopupContent(feature) {
    if (!feature.properties) return "";

    const { place, time, mag } = feature.properties;
    const depth = feature.geometry.coordinates[2];
    const date = new Date(time);

    return `<h3>${place}</h3><hr>${date}<br>Magnitude: ${mag} / Depth: ${depth}`;
}

// Function to determine color based on earthquake depth
function getColorForDepth(depth) {
    return DEPTH_COLORS[DEPTH_THRESHOLDS.findIndex(threshold => depth <= threshold)] || DEPTH_COLORS[DEPTH_COLORS.length - 1];
}

// Function to create a circle marker with size dependent on earthquake magnitude and color on depth
function createCircleMarker(feature, latlng) {
    let markerSize = Math.sqrt(Math.pow(10, feature.properties.mag)) / 50;
    return new L.CircleMarker(latlng, {
        radius: markerSize,
        fillOpacity: 0.80,
        color: getColorForDepth(feature.geometry.coordinates[2])
    });
}

// Function to create a legend for the map
function createLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info legend');
        let labels = ["<b>Depth (km)</b>"];
        DEPTH_THRESHOLDS.forEach((threshold, i) => {
            labels.push(`<li style="background:${DEPTH_COLORS[i]}"></li> ${i === 0 ? `0-${threshold}` : `${DEPTH_THRESHOLDS[i - 1] + 1}-${threshold}`}`);
        });
        labels.push(`<li style="background:${DEPTH_COLORS[DEPTH_COLORS.length - 1]}"></li> ${DEPTH_THRESHOLDS[DEPTH_THRESHOLDS.length - 1]}+`);
        div.innerHTML = labels.join('<br>');
        return div;
    };
    return legend;
}
