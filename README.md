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

Basic usage: [https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm](https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm)

Preview: [https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm](https://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm)

More complex example:

```javascript
// Preinitialized Icons That Could be Used for Customizing Layers' Markers
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
