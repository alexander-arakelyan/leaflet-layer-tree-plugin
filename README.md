# leaflet-layer-tree-plugin

Leafet.LayerTreePlugin

This plugin for Leaflet allows to switch layers on and off, structure them in a tree-like way

The list of layers to be displayed can be provided as a JavaScript object where each layer may look like as follows:
```json
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

More complex example:

```json
    {
      "code": "root",
      "name": "Все слои",
      "active": true,
      "selectedByDefault": false,
      "openByDefault": true,
      "childLayers": [
	{
	  "code": "base",
	  "name": "Base layers",
	  "active": true,
	  "selectedByDefault": false,
	  "openByDefault": true,
	  "parent": {
	    "code": null,
	    "name": null,
	    "active": true,
	    "selectedByDefault": false,
	    "openByDefault": true,
	    "childLayers": [],
	    "selectType": null,
	    "serviceType": null,
	    "params": {}
	  },
	  "childLayers": [
	    {
	      "code": "osm",
	      "name": "OpenStreetMap",
	      "active": true,
	      "selectedByDefault": true,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "MULTIPLE",
	      "serviceType": "OSM",
	      "params": {
		"url": "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
	      }
	    },
	    {
	      "code": "cosmoShooting",
	      "name": "Space Imagery",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "SINGLE",
	      "serviceType": null,
	      "params": {
		"url": "http://geoportal.sovzond.ru:10090/geoserver/gwc/service/wms"
	      }
	    },
	    {
	      "code": "addressPlan",
	      "name": "Address Plan",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "SINGLE",
	      "serviceType": "TILE",
	      "params": {
		"url": "http://geoportal.sovzond.ru:10090/geoserver/gwc/service/wms"
	      }
	    },
	    {
	      "code": "topo1-25000",
	      "name": "Top Base (vector 1:25000, 1:10000)",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "SINGLE",
	      "serviceType": "WMS",
	      "params": {
		"service": "WMS",
		"format": "image/png",
		"layers": "Adygeya:Adygeya_topo",
		"version": "1.1.1",
		"url": "http://geoportal.sovzond.ru:10090/geoserver/gwc/service/wms",
		"transparent": "TRUE"
	      }
	    },
	    {
	      "code": "google",
	      "name": "Google",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "NONE",
	      "serviceType": "GOOGLE",
	      "params": {}
	    },
	    {
	      "code": "google_terrain",
	      "name": "Google Terrain",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "NONE",
	      "serviceType": "GOOGLE_TERRAIN",
	      "params": {}
	    }
	  ],
	  "selectType": "SINGLE",
	  "serviceType": null,
	  "params": {}
	},
	{
	  "code": "overlays",
	  "name": "Overlays",
	  "active": true,
	  "selectedByDefault": false,
	  "openByDefault": true,
	  "parent": {
	    "code": null,
	    "name": null,
	    "active": true,
	    "selectedByDefault": false,
	    "openByDefault": true,
	    "childLayers": [],
	    "selectType": null,
	    "serviceType": null,
	    "params": {}
	  },
	  "childLayers": [
	    {
	      "code": "cadastral-info",
	      "name": "Cadastral Info",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [
		{
		  "code": "public-cadastral-map",
		  "name": "1. Public Cadaster Map",
		  "active": true,
		  "selectedByDefault": true,
		  "openByDefault": true,
		  "parent": {
		    "code": null,
		    "name": null,
		    "active": true,
		    "selectedByDefault": false,
		    "openByDefault": true,
		    "childLayers": [],
		    "selectType": null,
		    "serviceType": null,
		    "params": {}
		  },
		  "childLayers": [
		    {
		      "code": "lands",
		      "name": "2. Lands",
		      "active": true,
		      "selectedByDefault": true,
		      "openByDefault": true,
		      "parent": {
			"code": null,
			"name": null,
			"active": true,
			"selectedByDefault": false,
			"openByDefault": true,
			"childLayers": [],
			"selectType": null,
			"serviceType": null,
			"params": {}
		      },
		      "childLayers": [],
		      "selectType": "MULTIPLE",
		      "serviceType": "WFS",
		      "params": {
			"request": "getFeature",
			"service": "WFS",
			"typeName": "mgis2:lands_land",
			"style": "{\"stroke\":true,\"fillColor\":\"yellow\",\"border\":\"red\",\"weight\":3,\"opacity\":0.5,\"color\":\"red\",\"dashArray\":\"5\",\"fillOpacity\":0.1}",
			"version": "1.0.0",
			"outputFormat": "application/json",
			"url": "proxy?http://localhost:8081/geoserver/mgis2/wfs",
			"maxFeatures": "3000"
		      }
		    },
		    {
		      "code": "projected",
		      "name": "Projected",
		      "active": true,
		      "selectedByDefault": true,
		      "openByDefault": true,
		      "parent": {
			"code": null,
			"name": null,
			"active": true,
			"selectedByDefault": false,
			"openByDefault": true,
			"childLayers": [],
			"selectType": null,
			"serviceType": null,
			"params": {}
		      },
		      "childLayers": [],
		      "selectType": "MULTIPLE",
		      "serviceType": "WFS",
		      "params": {
			"request": "getFeature",
			"service": "WFS",
			"typeName": "mgis2:lands_land",
			"version": "1.0.0",
			"outputFormat": "application/json",
			"url": "proxy?http://localhost:8081/geoserver/mgis2/wfs"
		      }
		    },
		    {
		      "code": "waiting-for-registration",
		      "name": "Waiting For Registration",
		      "active": true,
		      "selectedByDefault": false,
		      "openByDefault": true,
		      "parent": {
			"code": null,
			"name": null,
			"active": true,
			"selectedByDefault": false,
			"openByDefault": true,
			"childLayers": [],
			"selectType": null,
			"serviceType": null,
			"params": {}
		      },
		      "childLayers": [],
		      "selectType": "MULTIPLE",
		      "serviceType": "WMS",
		      "params": {}
		    }
		  ],
		  "selectType": "MULTIPLE",
		  "serviceType": "WMS",
		  "params": {
		    "size": "1024,1024",
		    "f": "image",
		    "format": "PNG32",
		    "dpi": "96",
		    "url": "http://b.maps.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export",
		    "transparent": "true",
		    "imageSR": "102100"
		  }
		}
	      ],
	      "selectType": "MULTIPLE",
	      "serviceType": "WMS",
	      "params": {}
	    },
	    {
	      "code": "citybuilding-info",
	      "name": "Urban Planning Information",
	      "active": true,
	      "selectedByDefault": false,
	      "openByDefault": true,
	      "parent": {
		"code": null,
		"name": null,
		"active": true,
		"selectedByDefault": false,
		"openByDefault": true,
		"childLayers": [],
		"selectType": null,
		"serviceType": null,
		"params": {}
	      },
	      "childLayers": [],
	      "selectType": "MULTIPLE",
	      "serviceType": null,
	      "params": {}
	    }
	  ],
	  "selectType": "MULTIPLE",
	  "serviceType": null,
	  "params": {}
	}
      ],
      "selectType": "NONE",
      "serviceType": null,
      "params": {}
    }

```
