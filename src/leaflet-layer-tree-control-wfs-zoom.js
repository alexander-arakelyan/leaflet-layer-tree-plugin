L.Control.LayerTreeControl.WFSZoomFeature = function (leafTitle, layerSettings, options, map) {
	var feature = {
		fitWfsBounds: function (layerSettings, map) {
			var wfsUrl = layerSettings.params.url + L.Util.getParamString({request: "GetCapabilities"});
			var layerName = layerSettings.params.typeName != undefined ? layerSettings.params.typeName : layerSettings.params.layer;
			var south, west, north, east;
			$.ajax({
				url: wfsUrl,
				dataType: 'xml',
				success: function (data) {
					for (var i in  data.childNodes) {
						var wfsCapabilities = data.childNodes[i];
						if (wfsCapabilities.nodeName == "wfs:WFS_Capabilities") {
							for (var i2 in wfsCapabilities.childNodes) {
								var featureTypeList = wfsCapabilities.childNodes[i2];
								if (featureTypeList.nodeName == "FeatureTypeList") {
									for (var i3 in featureTypeList.childNodes) {
										var featureType = featureTypeList.childNodes[i3];
										if (featureType.nodeName == "FeatureType") {
											var nameTags = featureType.getElementsByTagName("Name");
											if (nameTags[i].childNodes[0].data == layerName) {
												for (var i4 in featureType.childNodes) {
													var boundingBox = featureType.childNodes[i4];
													if (boundingBox.nodeName == "ows:WGS84BoundingBox") {
														for (var i5 in boundingBox.childNodes) {
															var corner = boundingBox.childNodes[i5];
															switch (corner.nodeName) {
																case "ows:LowerCorner":
																{
																	var str = corner.childNodes[0].data.split(" ");
																	south = 1 * str[1];
																	west = 1 * str[0];

																}
																	break;
																case "ows:UpperCorner":
																{
																	var str = corner.childNodes[0].data.split(" ");
																	north = 1 * str[1];
																	east = 1 * str[0];
																}
																	break;
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
					if (south && west && north && east) {
						var southWest = new L.LatLng(south, west);
						var northEast = new L.LatLng(north, east);
						var bounds = new L.LatLngBounds(southWest, northEast);
						map.fitBounds(bounds);
					}
				},
				error: function () {
					console.error(arguments);
				}
			});
		},
		addWfsZoomToFeatureButton: function (leafTitle, layerSettings) {
			var elems = leafTitle.getElementsByClassName(options.className + "-leaf-wfs-zoom-to");
			if (elems.length == 0) {
				var handlerButton = L.DomUtil.create("span", options.className + "-leaf-wfs-zoom-to", leafTitle);
				handlerButton.innerHTML = "";
				var styleString = layerSettings.params.style;
				if (styleString) {
					var style = JSON.parse(styleString);
					for (var key in style) {
						var value = style [key];
						switch (key) {
							case "fillColor":
								handlerButton.style.backgroundColor = value;
								break;
							case "border":
								handlerButton.style.borderColor = value;
								break;
							case "weight":
								handlerButton.style.borderWidth = value + "px";
								break;
							case "opacity":
								handlerButton.style.opacity = value;
								break;
							case "dashArray":
								handlerButton.style.borderStyle = value >= 3 ? "dashed" : "dotted";
								break;
						}
					}
				}
				var me = this;
				L.DomEvent.on(handlerButton, "click", function (event) {
					me.fitWfsBounds(layerSettings, map);
				});
			}
		}
	}
	feature.addWfsZoomToFeatureButton(leafTitle, layerSettings);
};
