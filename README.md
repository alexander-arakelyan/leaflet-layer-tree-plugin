# leaflet-layer-tree-plugin

Leafet.LayerTreePlugin

This plugin for Leaflet allows to switch layers on and off, structure them in a tree-like way

The list of layers to be displayed can be provided as a JavaScript object where each layer may look like as follows:
```
			{
			    "code": "osm",
			    "name": "OpenStreetMap",
			    "active": true,
			    "selectedByDefault": true,
			    "openByDefault": true,
			    "childLayers": [],
			    "selectType": "MULTIPLE", // "SINGLE", "NONE"
			    "serviceType": "OSM", // "TILE", "WMS", "WFS", custom.
			    "params": {
				    "url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			    }
			}
```

Basic usage: https://github.com/bambrikii/leaflet-layer-tree-plugin/blob/master/examples/basic-example.htm

Preview: http://rawgit.com/bambrikii/leaflet-layer-tree-plugin/master/examples/basic-example.htm