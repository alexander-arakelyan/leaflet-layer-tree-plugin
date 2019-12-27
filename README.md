# leaflet-layer-tree-plugin

Leafet.LayerTreePlugin

This plugin for Leaflet allows to switch layers on and off, structure them in a tree-like way

The list of layers to be displayed can be provided as a JavaScript object where each layer may look like as follows:

```javascript
var layer = {
	code: "osm",
	name: "OpenStreetMap",
	active: true,
	selectedByDefault: true,
	openByDefault: true,
	childLayers: [],
	selectType: "MULTIPLE", // "SINGLE", "NONE"
	serviceType: "OSM", // "TILE", "WMS", "WFS", custom.
	params: {
		url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
	}
}
```

#### Static Definition of Layers

Basic usage: [https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm](https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm)

Preview: [https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm](https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm)

[See code example below](#static-definition-of-layers-code-example)

#### Dynamic Definition of Layers

Basic usage: [https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/dynamic-example.htm](https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/dynamic-example.htm)

Preview: [https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/dynamic-example.htm](https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/dynamic-example.htm)

[See code example below](#dynamic-definition-of-layers-code-example)


### Static Definition of Layers (Code Example)

More complex example:

```javascript
// Preinitialized Icons That Could be Used for Customizing Layers' Markers
function buildContentFromLayer(layer) {
    var content = "<table>";
    var properties = layer.feature.properties;
    for (var i in properties) {
	content += "<tr><td>" + i + "</td><td>" + properties[i] + "</td></tr>";
    }
    content += "</table>";
    return content;
}

var greenIcon = L.icon({
    iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-green.png',
    shadowUrl: 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',

    iconSize: [38, 95],
    shadowSize: [50, 64],
    iconAnchor: [22, 94],
    shadowAnchor: [4, 62],
    popupAnchor: [-3, -76]
});

// The Tree Control Configuration
[
		{
			code: "root",
			name: "All the Layers",
			active: true,
			selectedByDefault: false,
			openByDefault: true,
			childLayers: [
				{
					code: "base",
					name: "Base layers",
					active: true,
					selectedByDefault: false,
					openByDefault: true,
					childLayers: [
						{
							code: "osm",
							name: "OpenStreetMap",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							childLayers: [],
							selectType: "MULTIPLE",
							serviceType: "OSM",
							params: {
								url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							}
						},
						{
							code: "google",
							name: "Google",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							childLayers: [],
							selectType: "NONE",
							serviceType: "GOOGLE",
							params: {}
						},
						{
							code: "google_terrain",
							name: "Google Terrain",
							active: true,
							selectedByDefault: true,
							openByDefault: true,
							childLayers: [],
							selectType: "NONE",
							serviceType: "GOOGLE_TERRAIN",
							params: {}
						}
					],
					selectType: "SINGLE",
					serviceType: null,
					params: {}
				},
				{
					code: "overlays",
					name: "Overlays",
					active: true,
					selectedByDefault: false,
					openByDefault: true,
					childLayers: [
						{
							code: "50m_coastline",
							name: "rsg:50m_coastline",
							active: true,
							selectedByDefault: true,
							openByDefault: true,
							selectType: "MULTIPLE",
							serviceType: "WFS",
							coordinateSystem: "EPSG:4326",
							onPopup: function (layer) {
								return buildContentFromLayer(layer);
							},
							params: {
								request: "getFeature",
								service: "WFS",
								typeName: "rsg:50m_coastline",
								style: "{\"stroke\":true,\"fillColor\":\"violet\",\"border\":\"orange\",\"weight\":3,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
								version: "1.1.0",
								outputFormat: "application/json",
								url: "https://rsg.pml.ac.uk/geoserver/wfs",
								maxFeatures: "25"
							},
							childLayers: [
								{
									code: "MPA_SCOTLAND",
									name: "rsg:MPA_SCOTLAND",
									active: true,
									selectedByDefault: true,
									openByDefault: true,
									childLayers: [],
									selectType: "MULTIPLE",
									serviceType: "WFS",
									coordinateSystem: "EPSG:4326",
									onPopup: function (layer) {
										return buildContentFromLayer(layer);
									},
									params: {
										request: "getFeature",
										service: "WFS",
										typeName: "rsg:MPA_SCOTLAND",
										style: "{\"stroke\":true,\"fillColor\":\"yellow\",\"border\":\"gray\",\"weight\":3,\"opacity\":0.5,\"color\":\"gray\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
										version: "1.1.1",
										outputFormat: "application/json",
										url: "https://rsg.pml.ac.uk/geoserver/wfs",
										maxFeatures: "25"
									}
								},
								{
									code: "MMO_Fish_Shellfish_Cages_A",
									name: "rsg:MMO_Fish_Shellfish_Cages_A",
									active: true,
									selectedByDefault: false,
									openByDefault: true,
									childLayers: [],
									selectType: "MULTIPLE",
									serviceType: "WFS",
									coordinateSystem: "EPSG:4326",
									onPopup: function (layer) {
										return buildContentFromLayer(layer);
									},
									params: {
										request: "getFeature",
										service: "WFS",
										typeName: "rsg:MMO_Fish_Shellfish_Cages_A",
										version: "1.1.1",
										outputFormat: "application/json",
										url: "https://rsg.pml.ac.uk/geoserver/wfs",
										maxFeatures: "25"
									}
								}
							]
						},
						{
							code: "tiger_roads",
							name: "tiger:tiger_roads",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							selectType: "MULTIPLE",
							serviceType: "WFS",
							coordinateSystem: "EPSG:4326",
							onPopup: function (layer) {
								return buildContentFromLayer(layer);
							},
							params: {
								request: "getFeature",
								service: "WFS",
								typeName: "tiger:tiger_roads",
								style: "{\"stroke\":true,\"fillColor\":\"green\",\"border\":\"cyan\",\"weight\":3,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"3\",\"fillOpacity\":0.1}",
								version: "1.1.1",
								outputFormat: "application/json",
								url: "https://rsg.pml.ac.uk/geoserver/wfs",
								maxFeatures: "25"
							},
							childLayers: [
								{
									code: "poi",
									name: "tiger:poi",
									active: true,
									selectedByDefault: false,
									openByDefault: true,
									childLayers: [],
									selectType: "MULTIPLE",
									serviceType: "WFS",
									coordinateSystem: "EPSG:4326",
									onPopup: function (layer) {
										return buildContentFromLayer(layer);
									},
									params: {
										request: "getFeature",
										service: "WFS",
										typeName: "tiger:poi",
										version: "1.1.1",
										outputFormat: "application/json",
										url: "https://rsg.pml.ac.uk/geoserver/wfs",
										maxFeatures: "25",
										icon: greenIcon
									},
								}
							]
						}
					],
					selectType: "MULTIPLE",
					serviceType: null,
					params: {}
				}
			],
			selectType: "NONE",
			serviceType: null,
			params: {}
		}
]
```
### Dynamic Definition of Layers (Code Example)
Layers can also be inserted dynamically (see #10):

```javascript
	    var map = L.map("map1");
	    map.setView(new L.LatLng(0, 0), 1);

	    // Base Layers
	    var layerBuilders = {
		GOOGLE: function (layerSettings) {
		    return L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
			maxZoom: 20,
			subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
		    });
		},
		GOOGLE_TERRAIN: function (layerSettings) {
		    return L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
			maxZoom: 20,
			subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
		    });
		}

	    };

	    var rootLayerSettings = [

	    ];

	    // The Tree Control
	    var theTreeControl = new L.Control.LayerTreeControl({
		// layerTree: rootLayerSettings,
		openByDefault: true,
		layerBuilders: layerBuilders,
		featureBuilders: {
		    WFS: {
			zoom: L.Control.LayerTreeControl.WFSZoomFeature
		    }
		}
	    }).addTo(map);


	    var rootLayerId = theTreeControl.addLayerDynamically({
		code: "root",
		name: "All the Layers",
		active: true,
		selectedByDefault: false,
		openByDefault: true,
		childLayers: [],
		selectType: "NONE",
		serviceType: null,
		params: {}
	    });

	    var baseLayerId = theTreeControl.addLayerDynamically({
		code: "base",
		name: "Base layers",
		active: true,
		selectedByDefault: false,
		openByDefault: true,
		childLayers: [],
		selectType: "SINGLE",
		serviceType: null,
		params: {}

	    }, rootLayerId);

	    var overlaysLayerId = theTreeControl.addLayerDynamically({
		code: "overlays",
		name: "Overlays",
		active: true,
		selectedByDefault: false,
		openByDefault: true,
		childLayers: [],
		selectType: "MULTIPLE",
		serviceType: null,
		params: {}
	    }, rootLayerId);

	    var osmLayerId = theTreeControl.addLayerDynamically({
		code: "osm",
		name: "OpenStreetMap",
		active: true,
		selectedByDefault: true,
		openByDefault: true,
		childLayers: [],
		selectType: "MULTIPLE",
		serviceType: "OSM",
		params: {
		    url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
		}
	    }, baseLayerId);

	    var googleLayerId = theTreeControl.addLayerDynamically({
		code: "google",
		name: "Google",
		active: true,
		selectedByDefault: false,
		openByDefault: false,
		childLayers: [],
		selectType: "NONE",
		serviceType: "GOOGLE",
		params: {}
	    }, baseLayerId);

	    var coastLineId = theTreeControl.addLayerDynamically({
		code: "50m_coastline",
		name: "rsg:50m_coastline",
		active: true,
		selectedByDefault: true,
		openByDefault: true,
		selectType: "MULTIPLE",
		serviceType: "WFS",
		coordinateSystem: "EPSG:4326",
		onPopup: function (layer) {
		    return buildContentFromLayer(layer);
		},
		params: {
		    request: "getFeature",
		    service: "WFS",
		    typeName: "rsg:50m_coastline",
		    style: "{\"stroke\":true,\"fillColor\":\"violet\",\"border\":\"orange\",\"weight\":2,\"opacity\":1,\"color\":\"red\",\"dashArray\":\"3\",\"fillOpacity\":1}",
		    version: "1.1.0",
		    outputFormat: "application/json",
		    url: "https://rsg.pml.ac.uk/geoserver/wfs",
		    maxFeatures: "25"
		}
	    }, overlaysLayerId);

	    var scotlandLayerId = theTreeControl.addLayerDynamically({
		code: "MPA_SCOTLAND",
		name: "rsg:MPA_SCOTLAND",
		active: true,
		selectedByDefault: false,
		openByDefault: true,
		childLayers: [],
		selectType: "MULTIPLE",
		serviceType: "WFS",
		coordinateSystem: "EPSG:4326",
		onPopup: function (layer) {
		    return buildContentFromLayer(layer);
		},
		params: {
		    request: "getFeature",
		    service: "WFS",
		    typeName: "rsg:MPA_SCOTLAND",
		    style: "{\"stroke\":true,\"fillColor\":\"yellow\",\"border\":\"gray\",\"weight\":3,\"opacity\":0.5,\"color\":\"gray\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
		    version: "1.1.1",
		    outputFormat: "application/json",
		    url: "https://rsg.pml.ac.uk/geoserver/wfs",
		    maxFeatures: "25"
		}
	    }, coastLineId);

	    var shellFishCages = theTreeControl.addLayerDynamically({
		code: "MMO_Fish_Shellfish_Cages_A",
		name: "rsg:MMO_Fish_Shellfish_Cages_A",
		active: true,
		selectedByDefault: true,
		openByDefault: true,
		childLayers: [],
		selectType: "MULTIPLE",
		serviceType: "WFS",
		coordinateSystem: "EPSG:4326",
		onPopup: function (layer) {
		    return buildContentFromLayer(layer);
		},
		params: {
		    request: "getFeature",
		    service: "WFS",
		    typeName: "rsg:MMO_Fish_Shellfish_Cages_A",
		    style: "{\"stroke\":true,\"fillColor\":\"blue\",\"border\":\"violet\",\"weight\":3,\"opacity\":1,\"color\":\"orange\",\"dashArray\":\"1\",\"fillOpacity\":1}",
		    version: "1.1.1",
		    outputFormat: "application/json",
		    url: "https://rsg.pml.ac.uk/geoserver/wfs",
		    maxFeatures: "25"
		}
	    }, coastLineId);

//	    theTreeControl.removeLayerDynamically(shellFishCages);
//	    theTreeControl.removeLayerDynamically(overlaysLayerId);

```
### Popups

One can use "onPopup" property to define WFS layers in configuration.
The property value should be a function that accepts "layer" argument and returns html of the popup:

```javascript
var layer = {
	code: "adygeaPrevlik",
	name: "Adygeya:prevlik",
	active: true,
	selectedByDefault: true,
	openByDefault: true,
	childLayers: [],
	selectType: "MULTIPLE",
	serviceType: "WFS",
	onPopup: function (layer) {
		var content = "<table>";
		var properties = layer.feature.properties;
		for (var i in properties) {
			content += "<tr><td>" + i + "</td><td>" + properties[i] + "</td></tr>";
		}
		content += "</table>";
		return content;
	},
	params: {
		request: "getFeature",
		service: "WFS",
		typeName: "Adygeya:prevlik",
		version: "1.0.0",
		outputFormat: "application/json",
		url: "http://geoportal.sovzond.ru:10090/geoserver/Adygeya/wfs"
	}
	}
```
