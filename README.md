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

Basic usage: https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm

Preview: http://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm

More complex example:

```javascript
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
							selectedByDefault: true,
							openByDefault: true,
							childLayers: [],
							selectType: "MULTIPLE",
							serviceType: "OSM",
							params: {
								url: "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							}
						},
						{
							code: "topo1-25000",
							name: "Top Base (vector 1:25000, 1:10000)",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							childLayers: [],
							selectType: "SINGLE",
							serviceType: "WMS",
							params: {
								service: "WMS",
								format: "image/png",
								layers: "Adygeya:Adygeya_topo",
								version: "1.1.1",
								url: "http://geoportal.sovzond.ru:10090/geoserver/gwc/service/wms",
								transparent: "TRUE"
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
							selectedByDefault: false,
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
							code: "aelectro",
							name: "Adygeya:elektro",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							selectType: "MULTIPLE",
							serviceType: "WFS",
							params: {
								request: "getFeature",
								service: "WFS",
								typeName: "Adygeya:elektro",
								style: "{\"stroke\":true,\"fillColor\":\"green\",\"border\":\"cyan\",\"weight\":2,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"3\",\"fillOpacity\":0.1}",
								version: "1.0.0",
								outputFormat: "application/json",
								url: "http://geoportal.sovzond.ru:10090/geoserver/Adygeya/wfs",
								maxFeatures: "3000"
							},
							childLayers: [
								{
									code: "goroda",
									name: "rtk:Goroda",
									active: true,
									selectedByDefault: false,
									openByDefault: true,
									selectType: "MULTIPLE",
									serviceType: "WFS",
									params: {
										request: "getFeature",
										service: "WFS",
										typeName: "rtk:STAT_SUBJ",
										style: "{\"stroke\":true,\"fillColor\":\"violet\",\"border\":\"orange\",\"weight\":3,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
										version: "1.0.0",
										outputFormat: "application/json",
										url: "http://geoportal.sovzond.ru:10090/geoserver/rtk/wfs",
										maxFeatures: "3000"
									},
									childLayers: [
										{
											code: "adygea10",
											name: "Adygeya:LAYER10_line",
											active: true,
											selectedByDefault: false,
											openByDefault: true,
											childLayers: [],
											selectType: "MULTIPLE",
											serviceType: "WFS",
											params: {
												request: "getFeature",
												service: "WFS",
												typeName: "Adygeya:LAYER10_line",
												style: "{\"stroke\":true,\"fillColor\":\"yellow\",\"border\":\"red\",\"weight\":3,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
												version: "1.0.0",
												outputFormat: "application/json",
												url: "http://geoportal.sovzond.ru:10090/geoserver/Adygeya/wfs",
												maxFeatures: "3000"
											}
										},
										{
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
									]
								}
							]
						},
						{
							code: "citybuilding-info",
							name: "Urban Planning Information",
							active: true,
							selectedByDefault: false,
							openByDefault: true,
							childLayers: [],
							selectType: "MULTIPLE",
							serviceType: "WFS",
							params: {
								request: "getFeature",
								service: "WFS",
								style: "{\"stroke\":true,\"fillColor\":\"violet\",\"border\":\"yellow\",\"weight\":1,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
								typeName: "Adygeya:LAYER10_line",
								version: "1.0.0",
								outputFormat: "application/json",
								url: "http://geoportal.sovzond.ru:10090/geoserver/Adygeya/wfs"
							}
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

It's possible to use "onPopup" property to define WFS layers in configuration.
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
