L.Control.LayerTreeControl = L.Control.extend({
	options: {
		position: "topright",
		expand: false,
		className: "leaflet-layer-tree-control",
		layerTree: {},
		openByDefault: false,
		layerBuilders: {}
	},
	initialize: function (options) {
		L.Util.setOptions(this, options);
		if (options.layerTree == undefined) {
			throw Error("Layer tree required to display");
		}
		this._layers = new Array();
		this._reloadHandlers = {};
		this._minWidth = undefined;
	},
	onAdd: function (map) {
		this._map = map;
		var className = this.options.className;
		var container = this._container = L.DomUtil.create('div', className + " leaflet-control");
		L.DomEvent.disableClickPropagation(container);
		L.DomEvent.on(container, "wheel", L.DomEvent.stopPropagation);
		container.setAttribute("aria-haspopup", true);

		// Iconify
		var layersContainer = L.DomUtil.create('div', className + '-layers-open leaflet-control-layers', container);
		var iconifyToggleControl = L.DomUtil.create("div", className + "-toggle-open leaflet-control-layers", container);
		var icon = L.DomUtil.create("div", className + "-toggle-link", iconifyToggleControl);

		function iconifyLayersContainerToggleButton() {
			iconifyToggleControl.className = className + "-toggle-closed leaflet-control-layers"
		}

		function restoreLayersContainerToggleButton() {
			iconifyToggleControl.className = className + "-toggle-open leaflet-control-layers"
		}

		function isLayersContainerOpen() {
			return layersContainer.classList.contains(className + "-layers-open");
		}

		function closeLayersContainer() {
			layersContainer.className = className + '-layers-closed leaflet-control-layers';
		}

		function openLayersContainer() {
			layersContainer.className = className + '-layers-open leaflet-control-layers';
		}

		function updateLayerContainerMinWidth() {
			if (me._minWidth == undefined) {
				me._minWidth = layersContainer.offsetWidth;
			} else {
				if (me._minWidth < layersContainer.offsetWidth) {
					me._minWidth = layersContainer.offsetWidth;
				}
			}
			layersContainer.style.minWidth = me._minWidth + "px";
		}

		var me = this;

		// Order
		var orderContainer = L.DomUtil.create('div', className + '-order-closed leaflet-control-layers', container);
		var orderToggleControl = L.DomUtil.create("div", className + "-order-toggle-closed leaflet-control-layers", container);
		var order = L.DomUtil.create("div", className + "-order-toggle-link", orderToggleControl);

		function isOrderContainerOpen() {
			return orderContainer.classList.contains(className + "-order-open");
		}

		function closeOrderContainer() {
			orderContainer.className = className + '-order-closed leaflet-control-layers';
		}

		function openOrderContainer() {
			updateLayerContainerMinWidth();
			orderContainer.style.minWidth = layersContainer.style.minWidth;
			orderContainer.className = className + '-order-open leaflet-control-layers';
		}

		function openOrderToggleControl() {
			orderToggleControl.className = className + "-order-toggle-open leaflet-control-layers";
		}

		function closeOrderToggleControl() {
			orderToggleControl.className = className + "-order-toggle-closed leaflet-control-layers";
		}

		function hideOrderToggleControl() {
			orderToggleControl.className = className + "-order-toggle-hidden leaflet-control-layers";
		}

		var orderManager = {
			orderContainer: orderContainer,
			orderToggleControl: orderToggleControl,
			layersContainer: layersContainer,
			layers: me._layers,
			toggleOrder: function () {
				if (isOrderContainerOpen()) {
					closeOrderToggleControl();
					closeOrderContainer();
					openLayersContainer();
				} else {
					openOrderToggleControl();
					openOrderContainer();
					closeLayersContainer();
				}
			},
			reorder: function (top, bottom) {
				if (top > bottom) {
					var layers = orderManager.layers;
					var s = layers[top];
					for (var i = top; i > bottom; i--) {
						layers[i] = layers[i - 1];
					}
					layers[bottom] = s;
				} else if (top < bottom) {
					var layers = orderManager.layers;
					var s = layers[top];
					for (var i = top; i < bottom; i++) {
						layers[i] = layers[i + 1];
					}
					layers[bottom] = s;
				}
			},
			fillOrders: function () {
				this.orderContainer.innerHTML = "";
				var layers = this.layers;
				for (var i = layers.length - 1; i > -1; i--) {
					var layerContainer = layers[i];
					if (layerContainer.layer.setZIndex != undefined) {
						layerContainer.layer.setZIndex(i);
					}
					var row = L.DomUtil.create("div", className + "-order-row", this.orderContainer);
					var rowContent = L.DomUtil.create("div", className + "-order-row-content", row);
					var label = L.DomUtil.create("label", "", rowContent);
					label.innerHTML = layerContainer.name;

					if (i > 0) {
						var up = L.DomUtil.create("span", className + "-order-up", rowContent);
						L.DomEvent.on(up, "click", function (event) {
							var elem = event.currentTarget ? event.currentTarget : this;
							var layerId = elem.parentElement.layerId;
							var index = me._getLayerIndex(layerId);
							orderManager.reorder(index - 1, index);
							orderManager.fillOrders();
						});
					}
					if (i < layers.length - 1) {
						var down = L.DomUtil.create("span", className + "-order-down", rowContent);
						L.DomEvent.on(down, "click", function (event) {
							var elem = event.currentTarget ? event.currentTarget : this;
							var layerId = elem.parentElement.layerId;
							var index = me._getLayerIndex(layerId);
							orderManager.reorder(index + 1, index);
							orderManager.fillOrders();
						});
					}

					rowContent.layerId = layerContainer.id;
					rowContent.draggable = true;
					rowContent.droppable = true;
					rowContent.ondragstart = function (event) {
						var elem = event.currentTarget != undefined ? event.currentTarget : this;
						var sourceId = elem.layerId;
						event.dataTransfer.setData("text/plain", sourceId);
					};
					rowContent.ondragover = function (event) {
						var elem = event.currentTarget != undefined ? event.currentTarget : this;
						var sourceId = elem.layerId;
						var targetId = event.dataTransfer.getData("text/plain");
						var sourceIndex = me._getLayerIndex(sourceId);
						//var targetIndex = me._getLayerIndex(targetId);
						if (sourceIndex != undefined/* && targetIndex != undefined && sourceIndex != targetIndex*/) {
							event.preventDefault();
						}
					};
					rowContent.ondrop = function (event) {
						event.preventDefault();
						var elem = event.currentTarget != undefined ? event.currentTarget : this;
						var sourceId = elem.layerId;
						var targetId = event.dataTransfer.getData("text/plain");
						var sourceIndex = me._getLayerIndex(sourceId);
						var targetIndex = me._getLayerIndex(targetId);
						if (sourceIndex != undefined && targetIndex != undefined && sourceIndex != targetIndex) {
							orderManager.reorder(targetIndex, sourceIndex);
							orderManager.fillOrders();
						}
					}
				}
			}
		}

		function toggleIconify() {
			if (isLayersContainerOpen() || isOrderContainerOpen()) {
				closeLayersContainer();
				closeOrderContainer();
				iconifyLayersContainerToggleButton();
				hideOrderToggleControl();
			} else {
				openLayersContainer();
				closeOrderContainer();
				restoreLayersContainerToggleButton();
				closeOrderToggleControl();
			}
		}

		L.DomEvent.on(icon, "click", function (event) {
			toggleIconify();
		}, this);

		if (!this.options.openByDefault) {
			toggleIconify();
		}

		L.DomEvent.on(order, "click", function (event) {
			orderManager.fillOrders();
			orderManager.toggleOrder();
		});


		// Layers
		function toggleChildrenVisibility(elem, open) {
			if (
				(elem.childNodes.length >= 2 && (elem.childNodes[0].className == className + "-leaf-header")) &&
				(elem.childNodes.length >= 2 && (elem.childNodes[1].className == className + "-leaf-content"))
			) {
				var header = elem.childNodes[0];
				var content = elem.childNodes[1];
				var switcherRow = header.getElementsByClassName(className + "-leaf-switcher-row");
				if (switcherRow.length == 1) {
					var toggleButtons = switcherRow[0].getElementsByClassName(className + "-leaf-switcher");
					if (toggleButtons.length == 1) {
						var toggleButton = toggleButtons[0];
						if (open === undefined) {
							open = content.style.display == "none";
						}
						if (open) {
							content.style.display = "";
							toggleButton.className = className + "-leaf-switcher " + className + "-leaf-switcher-closed";
						} else {
							updateLayerContainerMinWidth();
							content.style.display = "none";
							toggleButton.className = className + "-leaf-switcher " + className + "-leaf-switcher-open";
						}
					}
				}
			}
		}

		function traverseLeaf(parentLeaf, parentContainer, leaf, parentId, order) {
			var leafContainer = L.DomUtil.create("div", className + "-leaf", parentContainer);
			var leafHeader = L.DomUtil.create("div", className + "-leaf-header", leafContainer);
			var leafTitle = L.DomUtil.create("span", className + "-leaf-title", leafHeader);
			if (leaf.childLayers != undefined && leaf.childLayers.length > 0) {
				var leafSwitcherRow = L.DomUtil.create("span", className + "-leaf-switcher-row", leafHeader);
				var leafSwitcher = L.DomUtil.create("span", className + "-leaf-switcher", leafSwitcherRow);
				L.DomEvent.on(leafSwitcher, "click", function (event) {
					var elem = event.srcElement != undefined ? event.srcElement : this;
					toggleChildrenVisibility(elem.parentElement.parentElement.parentElement);
				});
			}
			var layerId = parentId + "_" + leaf.code + "_" + order;

			function toggleLayerMULTIPLE(sourceElementId, checked, leafTitle) {
				if (sourceElementId) {
					// add or remove currently selected layer
					if (checked) {
						me.addLayer(leaf, sourceElementId, function (handlerFunction) {
							handlerFunction(leafTitle);
						});
					} else {
						me.removeLayer(sourceElementId);
					}
					orderManager.fillOrders();
				}
			}

			function toggleLayerSINGLE(parentElementId, sourceElementId, leafTitle) {
				me.removeLayers(parentLeaf, parentElementId);
				me.addLayer(leaf, sourceElementId, function (handlerFunction) {
					handlerFunction(leafTitle);
				});
				orderManager.fillOrders();
			}

			if (leaf.active) {
				switch (parentLeaf.selectType) {
					case "NONE":	//
						leafTitle.innerHTML = "<label>" + leaf.name + "</label>"
						break;
					case "SINGLE":	// radio-group
					{
						var parentLeafCode = parentLeaf.code;
						var checkbox = L.DomUtil.create("input", "", leafTitle);
						checkbox.name = parentLeafCode;
						checkbox.id = layerId;
						checkbox.parentId = parentId;
						checkbox.type = "radio";
						var label = L.DomUtil.create("label", "", leafTitle);
						var labelText = L.DomUtil.create("span", "", label);
						labelText.innerHTML = leaf.name;
						L.DomEvent.on(checkbox, "change", function (event) {
							var elem = event.srcElement != undefined ? event.srcElement : this;
							var sourceElementId = elem.id;
							if (sourceElementId) {
								var parentElementId = elem.parentId;
								var checked = elem.checked;
								if (checked) {
									toggleLayerSINGLE(parentElementId, sourceElementId);
								}
							}
						});
						L.DomEvent.on(label, "click", function (event) {
							var elem = event.srcElement != undefined ? event.srcElement : this;
							var checkbox = elem.parentElement.parentElement.getElementsByTagName("input")[0];
							checkbox.checked = true;
							var parentElementId = checkbox.parentId;
							var sourceElementId = checkbox.id;
							toggleLayerSINGLE(parentElementId, sourceElementId);
						});
						if (leaf.selectedByDefault) {
							checkbox.checked = true;
							toggleLayerSINGLE(parentId, layerId);
						}
					}
						break;
					case "MULTIPLE":
					default:	// checkboxes
					{
						var parentLeafCode = parentLeaf.code;
						var checkbox = L.DomUtil.create("input", "", leafTitle);
						checkbox.name = parentLeafCode;
						checkbox.id = layerId;
						checkbox.parentId = parentId;
						checkbox.type = "checkbox";
						var label = L.DomUtil.create("label", "", leafTitle);
						var labelText = L.DomUtil.create("span", "", label);
						labelText.innerHTML = leaf.name;
						L.DomEvent.on(checkbox, "change", function (event) {
							var elem = event.srcElement != undefined ? event.srcElement : this;
							toggleLayerMULTIPLE(elem.id, elem.checked, leafTitle);
						});
						L.DomEvent.on(label, "click", function (event) {
							var elem = event.srcElement != undefined ? event.srcElement : this;
							var checkbox = elem.parentElement.parentElement.getElementsByTagName("input")[0];
							var checked;
							if (checkbox.checked == true) {
								checkbox.checked = undefined;
								checked = false;
							} else {
								checkbox.checked = true;
								checked = true;
							}
							var sourceElementId = checkbox.id;
							toggleLayerMULTIPLE(sourceElementId, checked, leafTitle);
						});
						if (leaf.selectedByDefault) {
							checkbox.checked = true;
							toggleLayerMULTIPLE(layerId, true, leafTitle);
						}
					}
						break;
				}
				var leafContent = L.DomUtil.create("div", className + "-leaf-content", leafContainer);
				if (leaf.childLayers && leaf.childLayers.length > 0) {
					for (var i in leaf.childLayers) {
						var child = leaf.childLayers[i];
						if (child) {
							traverseLeaf(leaf, leafContent, child, layerId, i);
						}
					}
				}

				toggleChildrenVisibility(leafContainer.parentNode.parentNode, parentLeaf.openByDefault);
			}
		}

		var layerTree = this.options.layerTree;
		if (Object.prototype.toString.call(layerTree) === '[object Array]') {
			for (var i in layerTree) {
				var layerSubTree = layerTree[i];
				traverseLeaf(layerSubTree, layersContainer, layerSubTree, "", 0);
			}
		} else {
			traverseLeaf(layerTree, layersContainer, layerTree, "", 0);
		}

		orderManager.fillOrders();

		return container;
	},
	onRemove: function (map) {

	},
	copyParams: function (layerSettings, exceptions) {
		var params = {};
		for (var paramKey in layerSettings.params) {
			if (!exceptions || !exceptions.test(paramKey)) {
				params[paramKey] = layerSettings.params[paramKey];
			}
		}
		return params;
	},
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
										for (var i4 in nameTags) {
											if (nameTags[i].childNodes[0].data == layerName) {
												{
													var lowerCorners = featureType.getElementsByTagName("LowerCorner");
													var str = lowerCorners[0].childNodes[0].data.split(" ");
													south = 1 * str[0];
													west = 1 * str[1];
												}
												{
													var upperCorners = featureType.getElementsByTagName("UpperCorner");
													var str = upperCorners[0].childNodes[0].data.split(" ");
													north = 1 * str[0];
													east = 1 * str[1];
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
		var map = this._map;
		var elems = leafTitle.getElementsByClassName(this.options.className + "-leaf-wfs-zoom-to");
		if (elems.length == 0) {
			var handlerButton = L.DomUtil.create("span", this.options.className + "-leaf-wfs-zoom-to", leafTitle);
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
							handlerButton.style.borderWidth = "1px";
							break;
						case "opacity":
							handlerButton.style.opacity = value;
							break;
						case "dashArray":
							handlerButton.style.borderStyle = "dashed";
							break;
					}
				}
			}
			var me = this;
			L.DomEvent.on(handlerButton, "click", function (event) {
				me.fitWfsBounds(layerSettings, map);
			});
		}
	},
	addLayer: function (layerSettings, layerId, addFeature) {
		var map = this._map;
		var me = this;
		switch (layerSettings.serviceType) {
			case "OSM":
				var layer = L.tileLayer(layerSettings.params.url, {});
				this._addLayer(layer, layerId, layerSettings);
				break;
			case "TILE":
				var layer = L.tileLayer(layerSettings.params.url, {});
				this._addLayer(layer, layerId, layerSettings);
				break;
			case "WMS":
			{
				var params = this.copyParams(layerSettings, /\burl\b/gi);
				var layer = L.tileLayer.wms(layerSettings.params.url, params).addTo(map);
				this._addLayer(layer, layerId, layerSettings);
			}
				break;
			case "WFS":
			{
				var layer = new L.GeoJSON().addTo(map);
				var params = this.copyParams(layerSettings, /\b(url|style)\b/gi);

				this._addLayer(layer, layerId, layerSettings);
				var wfsHandler = function () {
					var customParams = {
						bbox: map.getBounds().toBBoxString(),
					};
					var params2 = L.Util.extend(params, customParams);
					var wfsUrl = layerSettings.params.url + L.Util.getParamString(params2);
					$.ajax({
						url: wfsUrl,
						dataType: 'json',
						success: function (data) {
							layer.clearLayers();
							layer.addData(data);
							if (layerSettings.params.style) {
								var style = JSON.parse(layerSettings.params.style);
								layer.eachLayer(function (layer) {
									layer.setStyle(style);
								});
							}
						},
						error: function () {
							console.error(arguments);
						}
					});
				}
				wfsHandler();
				addFeature(function (leafTitle) {
					me.addWfsZoomToFeatureButton(leafTitle, layerSettings);
				}, layerSettings);
				this._reloadHandlers[layerId + "__moveend"] = wfsHandler;
				map.on("moveend", wfsHandler);
			}
				break;
			default:
				if (this.options.layerBuilders != undefined && this.options.layerBuilders != null && this.options.layerBuilders.hasOwnProperty(layerSettings.serviceType)) {
					var layer = this.options.layerBuilders[layerSettings.serviceType](layerSettings);
					this._addLayer(layer, layerId, layerSettings);
				}
				break;
		}
	},
	_addLayer: function (layer, layerId, layerSettings) {
		if (layer) {
			this._layers.push({id: layerId, layer: layer, name: layerSettings.name});
			this._map.addLayer(layer);
		}
	},
	removeLayers: function (layer, parentId) {
		this.removeLayer(layer);
		if (layer.childLayers && layer.childLayers.length > 0) {
			for (var i in layer.childLayers) {
				var child = layer.childLayers[i];
				this.removeLayer(parentId + "_" + child.code + "_" + i);
			}
		}
	},
	_getLayerIndex: function (layerId) {
		for (var i in this._layers) {
			var layerContainer = this._layers[i];
			if (layerContainer.id == layerId) {
				return 1 * i;
			}
		}
		return undefined;
	},
	removeLayer: function (layerId) {
		var map = this._map;
		var layerIndex = this._getLayerIndex(layerId);
		if (layerIndex != undefined) {
			var layerContainer = this._layers[layerIndex];
			var layer = layerContainer.layer;
			map.removeLayer(layerContainer.layer);
			delete layerContainer.layer;
			delete layer;
			delete layerContainer;
			this._layers.splice(layerIndex, 1);
		}
		if (this._reloadHandlers.hasOwnProperty(layerId + "__moveend")) {
			map.off("moveend", this._reloadHandlers[layerId + "__moveend"]);
			delete this._reloadHandlers[layerId + "__moveend"];
		}
	}
})
;
