L.Control.LayerTreeControl = L.Control.extend({
    options: {
	position: "topright",
	expand: false,
	className: "leaflet-layer-tree-control",
	openByDefault: false,
	layerBuilders: {},
	featureBuilders: {
	    WFS: {}
	}
    },
    initialize: function (options) {
	L.Util.setOptions(this, options);
	if (options.layerTree != undefined) {
	    this._layerTree = options.layerTree;
	}
	// this._layers = new Array();
	this._layerSettingsById = {};
	this._layerMenuContainersById = {};
	this._layerZIndexesById = {};
	this._mapLayersById = {};
	this._childLayers = {};
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

	this.setLayerMenuContainerById2("root", layersContainer);
	var me = this;

	var layerManager = new LeafletLayerTreeLayerManager(className, iconifyToggleControl, layersContainer, me);

	// Order
	var orderContainer = L.DomUtil.create('div', className + '-order-closed leaflet-control-layers', container);
	var orderToggleControl = L.DomUtil.create("div", className + "-order-toggle-closed leaflet-control-layers", container);
	var order = L.DomUtil.create("div", className + "-order-toggle-link", orderToggleControl);

	var orderManager = this._orderManager = new LeafletLayerTreeOrderManager(className, orderContainer, orderToggleControl, layersContainer, me,
		layerManager);

	function toggleIconify() {
	    if (layerManager.isLayersContainerOpen() || orderManager.isOrderContainerOpen()) {
		layerManager.closeLayersContainer();
		orderManager.closeOrderContainer();
		layerManager.iconifyLayersContainerToggleButton();
		orderManager.hideOrderToggleControl();
	    } else {
		layerManager.openLayersContainer();
		orderManager.closeOrderContainer();
		layerManager.restoreLayersContainerToggleButton();
		orderManager.closeOrderToggleControl();
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

	var childrenVisibilityToggler = new LeafletLayerTreeLayerChildrenVisibilityToggler(className, layerManager);
	var leafTraverser = this._leafTraverser = new LeafletLayerTreeLeafTraverser(this, className, childrenVisibilityToggler, orderManager);
	this.processLayerTree(me.options.layerTree, layersContainer, layerManager, orderManager, childrenVisibilityToggler, leafTraverser);

	orderManager.fillOrders();
	return container;
    },
    processLayerTree: function (layerTree, layersContainer, layerManager, orderManager, childrenVisibilityToggler, leafTraverser) {
	if (!layerTree) {
	    return;
	}
	if (Object.prototype.toString.call(layerTree) === '[object Array]') {
	    for (var i in layerTree) {
		var layerSubTree = layerTree[i];
		leafTraverser.addLeaf(layerSubTree, layersContainer, layerSubTree, "", i, this, orderManager);
	    }
	} else {
	    leafTraverser.addLeaf(layerTree, layersContainer, layerTree, "", i, this, orderManager);
	}
	delete this._layerTree;
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
    addLayerToMap: function (layerSettings, layerId) {
	if (this._mapLayersById.hasOwnProperty(layerId)) {
	    console.warn("Layer [" + layerId + "] already exists. Skipping...")
	    return;
	}
	this._layerSettingsById[layerId] = layerSettings;
	var map = this._map;
	var me = this;
	switch (layerSettings.serviceType) {
	    case "OSM":
		var layer = L.tileLayer(layerSettings.params.url, {});
		this._addLayerToMap(layer, layerId, layerSettings);
		break;
	    case "TILE":
		var layer = L.tileLayer(layerSettings.params.url, {});
		this._addLayerToMap(layer, layerId, layerSettings);
		break;
	    case "WMS":
		{
		    var params = this.copyParams(layerSettings, /\burl\b/gi);
		    var layer = L.tileLayer.wms(layerSettings.params.url, params).addTo(map);
		    this._addLayerToMap(layer, layerId, layerSettings);
		}
		break;
	    case "WFS":
		{
		    var layers = new L.GeoJSON().addTo(map);
		    var params = this.copyParams(layerSettings, /\b(url|style)\b/gi);

		    this._addLayerToMap(layers, layerId, layerSettings);
		    var wfsHandler = function () {
			var bbox = map.getBounds().toBBoxString();
			if (layerSettings.coordinateSystem) {
			    bbox += "," + layerSettings.coordinateSystem;
			}
			var customParams = {
			    bbox: bbox,
			};
			var params2 = L.Util.extend(params, customParams);
			var wfsUrl = layerSettings.params.url + L.Util.getParamString(params2);
			$.ajax({
			    url: wfsUrl,
			    dataType: 'json',
			    success: function (data) {
				layers.clearLayers();
				layers.addData(data);
				var style = layerSettings.params.style;
				if (style) {
				    var styleObj = JSON.parse(style);
				    layers.eachLayer(function (layer) {
					layer.setStyle(styleObj);
				    });
				}
				var icon = layerSettings.params.icon;
				if (icon) {
				    layers.eachLayer(function (layer) {
					layer.setIcon(icon);
				    });
				}
				var onPopup = layerSettings.onPopup;
				var getType = {};
				if (onPopup && getType.toString.call(onPopup) === '[object Function]') {
				    layers.eachLayer(function (layer) {
					var func = layerSettings.onPopup(layer);
					if (func) {
					    layer.bindPopup(func);
					}
				    });
				}
			    },
			    error: function () {
				console.error(arguments);
			    }
			});
		    }
		    wfsHandler();
		    this._reloadHandlers[layerId + "__moveend"] = wfsHandler;
		    map.on("moveend", wfsHandler);
		}
		break;
	    default:
		if (this.options.layerBuilders != undefined && this.options.layerBuilders != null
			&& this.options.layerBuilders.hasOwnProperty(layerSettings.serviceType)) {
		    var layer = this.options.layerBuilders[layerSettings.serviceType](layerSettings);
		    this._addLayerToMap(layer, layerId, layerSettings);
		}
		break;
	}
    },
    _addLayerToMap: function (layer, layerId, layerSettings) {
	if (!layer) {
	    return;
	}
	if (this._mapLayersById.hasOwnProperty(layerId)) {
	    console.warn("Map Layer " + layerId + " already exists! Skipping...");
	    return; // TODO:
	}
	var max = -1;
	for (var propName in this._layerZIndexesById) {
	    var curr = this._layerZIndexesById[propName];
	    if (curr > max) {
		max = curr;
	    }
	}
	this._layerZIndexesById[layerId] = max + 1;
	this._map.addLayer(layer);
	this._mapLayersById[layerId] = layer;
    },
    removeLayerFromMap: function (layerId) {
	if (this._childLayers.hasOwnProperty(layerId)) {
	    var children = this._childLayers[layerId];
	    for (var childId in children) {
		this.removeLayerFromMap(childId);
		this._removeLayerFromMap(childId);
	    }
	}
	this._removeLayerFromMap(layerId);
    },
    _removeLayerFromMap: function (layerId) {
	if (this._layerSettingsById.hasOwnProperty(layerId)) {
	    var map = this._map;
	    var layerIndex = this._layerZIndexesById[layerId];
	    delete layerIndex;
	    delete this._layerZIndexesById[layerId];
	    if (this._reloadHandlers.hasOwnProperty(layerId + "__moveend")) {
		map.off("moveend", this._reloadHandlers[layerId + "__moveend"]);
		delete this._reloadHandlers[layerId + "__moveend"];
	    }
	    if (this._layerMenuContainersById.hasOwnProperty(layerId)) {
		var mapLayer = this._mapLayersById[layerId];
		if (mapLayer) {
		    map.removeLayer(mapLayer);
		}
		delete this._mapLayersById[layerId];
	    }
	}
    },
    addLayerDynamically: function (layerSettings, parentLayerId) {
	// find parent layer,
	var parentLayerSettings;
	if (parentLayerId) {
	    parentLayerSettings = this._layerSettingsById[parentLayerId];
	    if (!parentLayerSettings) {
		throw "Cannot find [" + parentLayerId + "] layer settings.";
	    }
	} else {
	    parentLayerId = "root";
	    parentLayerSettings = {
		name: "Root",
		active: true,
		selectType: "NONE",
		openByDefault: true
	    };
	    this._layerSettingsById[parentLayerId] = parentLayerSettings;
	}

	// add layer to parent
	let parentContainer = this.getLayerContainerById2(parentLayerId);
	var parentContainerContent = (parentContainer //
		&& parentContainer.childNodes //
		&& parentContainer.childNodes.length >= 2 //
		&& parentContainer.childNodes[1].className == className //
		+ "-leaf-content") //
		? parentContainer.childNodes[1] //
		: parentContainer;

	var leafId = this._leafTraverser.addLeaf(parentLayerSettings, parentContainerContent, layerSettings, parentLayerId, 0);
	this._layerSettingsById[leafId] = layerSettings;
	this.setChildLayer(parentLayerId, leafId);
	return leafId;
    },
    removeLayerDynamically: function (layerId) {
	// remove layer
	this.removeLayerFromMap(layerId);
	delete this._layerZIndexesById[layerId];
	delete this._layerMenuContainersById[layerId];
	delete this._layerSettingsById[layerId];
    },
    getLayerContainerById2: function (layerId) {
	var layerContainer = this._layerMenuContainersById[layerId];
	return layerContainer;
    },
    setLayerMenuContainerById2: function (layerId, layerMenuContainer) {
	if (this._layerMenuContainersById.hasOwnProperty(layerId)) {
	    throw Error("LayerContainer for " + layerId + " already exists.");
	}
	this._layerMenuContainersById[layerId] = layerMenuContainer;
    },
    setChildLayer: function (layerId, childLayerId) {
	if (!this._childLayers.hasOwnProperty(layerId)) {
	    this._childLayers[layerId] = {};
	}
	this._childLayers[layerId][childLayerId] = true;
    },
    removeChildLayer: function (layerId, parentLayerId) {
	if (!this._childLayers.hasOwnProperty(parentLayerId)) {
	    return;
	}
	if (!this._childLayers[parentLayerId].hasOwnProperty(layerId)) {
	    return;
	}
	delete this._childLayers[parentLayerId][layerId];
    }
});

function LeafletLayerTreeCheckboxWrapper(className) {
    var INCLUDE_NONE = "none";
    var INCLUDE_SELF = "self";
    var INCLUDE_CHILDREN = "including-children";
    this.className = className;
    var childrenCheckboxes = {};
    var layers = {};
    var layerSettings = {};

    return {
	prepare: function prepare(layerId, parentId, parentLeaf, leafTitle, leaf, me, orderManager) {

	    function resetIncludeChildrenForParent(elementId) {
		var elem = document.getElementById(elementId);
		if (elem && layers.hasOwnProperty(elementId)) {
		    var parentId = layers[elementId].parentId;
		    var parent = document.getElementById(parentId);
		    if (parent) {
			var parentState = readCheckboxState0(parent);
			if (parentState == INCLUDE_CHILDREN) {
			    updateCheckboxState0(parent, INCLUDE_SELF);
			    resetIncludeChildrenForParent(parentId);
			}
		    }
		}
	    }

	    function readCheckboxState0(element) {
		return element.value;
	    }

	    function updateCheckboxState0(checkbox, state) {
		checkbox.value = state;
		checkbox.className = className + ".leaflet-layer-tree-control-select-layers " + className + "-select-layers-" + state;
	    }

	    function updateCheckboxState(elementId, state) {
		var elem = document.getElementById(elementId);
		if (elem) {
		    var nextState = calcAvailableState0(elementId, state);
		    updateCheckboxState0(elem, nextState);
		}
	    }

	    function toggleLayerMULTIPLE(elementId, state) {
		if (elementId) {
		    // add or remove currently selected layer
		    if (state == INCLUDE_CHILDREN) {
			var childIds = childrenCheckboxes[elementId];
			for (var i in childIds) {
			    var childId = childIds[i];
			    toggleLayerMULTIPLE(childId, state);
			    updateCheckboxState(childId, state);
			}
			me.addLayerToMap(layerSettings[elementId], elementId);
		    } else if (state == INCLUDE_SELF) {
			me.addLayerToMap(leaf, elementId);
			// updateCheckboxState(elementId, INCLUDE_SELF);
		    } else {
			var childIds = childrenCheckboxes[elementId];
			for (var i in childIds) {
			    var childId = childIds[i];
			    toggleLayerMULTIPLE(childId, state);
			    updateCheckboxState(childId, state);
			}
			me.removeLayerFromMap(elementId);
		    }
		    orderManager.fillOrders();
		}
	    }

	    var parentLeafCode = parentLeaf.code;

	    var checkbox = L.DomUtil.create("div", "", leafTitle);
	    checkbox.name = parentLeafCode;
	    checkbox.id = layerId;
	    checkbox.parentId = parentId;
	    checkbox.className = className + ".leaflet-layer-tree-control-select-layers " + className + "-select-layers-" + INCLUDE_NONE;
	    checkbox.value = INCLUDE_NONE;

	    var label = L.DomUtil.create("label", "", leafTitle);
	    var labelText = L.DomUtil.create("span", "", label);
	    labelText.innerHTML = leaf.name;

	    function calcAvailableState0(layerId, state) {
		var childrenCheckboxesList = childrenCheckboxes[layerId];
		if (state == INCLUDE_CHILDREN && (childrenCheckboxesList == undefined || childrenCheckboxesList.length == 0)) {
		    return INCLUDE_SELF;
		}
		return state;
	    }

	    function advanceState0(layerId, currentState) {
		var childrenCheckboxesList = childrenCheckboxes[layerId];
		var nextState = INCLUDE_NONE;
		if (currentState == INCLUDE_NONE) {
		    nextState = INCLUDE_SELF;
		} else if (childrenCheckboxesList != undefined && childrenCheckboxesList.length > 0 && currentState == INCLUDE_SELF) {
		    nextState = INCLUDE_CHILDREN;
		}
		return nextState;
	    }

	    function advanceState(event) {
		var elem = event.srcElement != undefined ? event.srcElement : this;
		var checkbox = elem.parentElement.parentElement.getElementsByTagName("div")[0];
		var elementId = checkbox.id;
		var currentState = checkbox.value;
		var nextState = advanceState0(elementId, currentState);
		updateCheckboxState0(checkbox, nextState);
		resetIncludeChildrenForParent(elementId);
		toggleLayerMULTIPLE(elementId, nextState, leafTitle);
	    }

	    L.DomEvent.on(checkbox, "click", function (event) {
		advanceState.call(this, event);
	    });
	    L.DomEvent.on(label, "click", function (event) {
		advanceState.call(this, event);
	    });
	    if (leaf.selectedByDefault) {
		updateCheckboxState0(checkbox, INCLUDE_SELF);
		toggleLayerMULTIPLE(layerId, checkbox.value, leafTitle);
	    }

	    return parentLeafCode;
	},
	clearChildCheckboxCounter: function () {
	    childrenCheckboxes = {};
	    layerSettings = {};
	    layers = {};
	},
	incrementChildrenCheckbox: function (parentId, childId, leaf) {
	    if (!childrenCheckboxes.hasOwnProperty(parentId)) {
		childrenCheckboxes[parentId] = new Array();
	    }
	    childrenCheckboxes[parentId].push(childId);
	    layerSettings[childId] = leaf;
	    layers[childId] = {
		parentId: parentId
	    };
	}
    }
}

function LeafletLayerTreeLeafTraverser(thePluginArg, className, childrenVisibilityToggler, orderManagerArg) {
    this.className = className;
    var checkboxWrapper = LeafletLayerTreeCheckboxWrapper(className);
    var orderManager = orderManagerArg;
    var thePlugin = thePluginArg;
    return {
	buildLeafId: function (parentId, leafSettings, order) {
	    return parentId + "_" + leafSettings.code + "_" + order;
	},
	addLeaf: function (parentLeafSettings, parentContainer, leafSettings, parentLeafId, leafOrder) {
	    var leafContainer = L.DomUtil.create("div", className + "-leaf", parentContainer);
	    var leafHeader = L.DomUtil.create("div", className + "-leaf-header", leafContainer);
	    var leafTitle = L.DomUtil.create("span", className + "-leaf-title", leafHeader);
	    if (parentContainer.parentNode && parentContainer.parentNode.childNodes.length >= 1
		    && parentContainer.parentNode.childNodes[0].className === className + "-leaf-header") {
		createSwitcher(className, parentContainer.parentNode.childNodes[0]);
	    }

	    var leafId = this.buildLeafId(parentLeafId, leafSettings, leafOrder);
	    if (leafSettings.active) {
		switch (parentLeafSettings.selectType) {
		    case "NONE": //
			createNONELeaf(leafSettings, leafTitle);
			break;
		    case "SINGLE": // radio-group
			createSINGLELeaf(leafSettings, leafTitle, parentLeafSettings, leafId, parentLeafId, thePlugin, orderManager);
			break;
		    case "MULTIPLE":
		    default: // checkboxes
			createMULTIPLELeaf(leafId, parentLeafId, parentLeafSettings, leafTitle, leafSettings);
			break;
		}
		if (thePlugin.options.featureBuilders.hasOwnProperty(leafSettings.serviceType)) {
		    var featureBuilders = thePlugin.options.featureBuilders[leafSettings.serviceType];
		    for (var i in featureBuilders) {
			var featureBuilder = featureBuilders[i];
			featureBuilder(leafTitle, leafSettings, thePlugin.options, thePlugin._map);
		    }
		}
		var leafContent = L.DomUtil.create("div", className + "-leaf-content", leafContainer);
		if (leafSettings.childLayers && leafSettings.childLayers.length > 0) {
		    for (var i in leafSettings.childLayers) {
			var childleafSettings = leafSettings.childLayers[i];
			if (childleafSettings) {
			    this.addLeaf(leafSettings, leafContent, childleafSettings, leafId, i);
			}
		    }
		}
		if (leafContainer.parentNode && leafContainer.parentNode.parentNode) {
		    childrenVisibilityToggler.toggleChildrenVisibility(leafContainer.parentNode.parentNode, parentLeafSettings.openByDefault);
		}
	    }
	    thePlugin.setChildLayer(parentLeafId, leafId);
	    thePlugin.setLayerMenuContainerById2(leafId, leafContainer);
	    return leafId;
	},
	removeLeaf: function (thePlugin, leafId) {
	    // TODO:
	}
    }

    function createSwitcher(className, leafHeader) {
	if (leafHeader.getElementsByClassName(className + "-leaf-switcher-row").length == 0) {
	    var leafSwitcherRow = L.DomUtil.create("span", className + "-leaf-switcher-row", leafHeader);
	    var leafSwitcher = L.DomUtil.create("span", className + "-leaf-switcher", leafSwitcherRow);
	    L.DomEvent.on(leafSwitcher, "click", function (event) {
		var elem = event.srcElement != undefined ? event.srcElement : this;
		childrenVisibilityToggler.toggleChildrenVisibility(elem.parentElement.parentElement.parentElement);
	    });
	}
    }

    function createMULTIPLELeaf(leafId, parentLeafId, parentLeafSettings, leafTitle, leafSettings) {
	checkboxWrapper.prepare(leafId, parentLeafId, parentLeafSettings, leafTitle, leafSettings, thePlugin, orderManager);
	checkboxWrapper.incrementChildrenCheckbox(parentLeafId, leafId, leafSettings);
    }

    function createSINGLELeaf(leafSettings, leafTitle, parentLeafSettings, leafId, parentLeafId, thePlugin, orderManager) {
	function toggleLayerSINGLE(parentElementId, sourceElementId, leafTitle) {
	    thePlugin.removeLayerFromMap(parentElementId);
	    thePlugin.addLayerToMap(leafSettings, sourceElementId);
	    orderManager.fillOrders();
	}

	var checkbox = L.DomUtil.create("input", "", leafTitle);
	checkbox.name = parentLeafSettings.code;
	checkbox.id = leafId;
	checkbox.parentId = parentLeafId;
	checkbox.type = "radio";
	var label = L.DomUtil.create("label", "", leafTitle);
	var labelText = L.DomUtil.create("span", "", label);
	labelText.innerHTML = leafSettings.name;
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
	if (leafSettings.selectedByDefault) {
	    toggleLayerSINGLE(parentLeafId, leafId);
	    checkbox.checked = "checked";
	}
    }

    function createNONELeaf(leafSettings, leafTitle) {
	leafTitle.innerHTML = "<label>" + leafSettings.name + "</label>";
    }
}

function LeafletLayerTreeLayerChildrenVisibilityToggler(className, layerManager) {
    this.className = className;

    function checkIfParentIsHeader(elem) {
	var childNodesGreaterThanTwo = elem.childNodes.length >= 2;
	if (!childNodesGreaterThanTwo) {
	    return false;
	}
	var headerNodeExists = elem.childNodes[0].className == className + "-leaf-header";
	var contentNodeExists = elem.childNodes[1].className == className + "-leaf-content";
	return headerNodeExists && contentNodeExists;
    }

    // Layers
    return {
	toggleChildrenVisibility: function (elem, open) {
	    if (!checkIfParentIsHeader(elem)) {
		return;
	    }
	    var header = elem.childNodes[0];
	    var content = elem.childNodes[1];
	    var switcherRow = header.getElementsByClassName(className + "-leaf-switcher-row");
	    if (switcherRow.length != 1) {
		return;
	    }
	    var toggleButtons = switcherRow[0].getElementsByClassName(className + "-leaf-switcher");
	    if (toggleButtons.length != 1) {
		return;
	    }
	    var toggleButton = toggleButtons[0];
	    if (open === undefined) {
		open = content.style.display == "none";
	    }
	    if (open) {
		content.style.display = "";
		toggleButton.className = className + "-leaf-switcher " + className + "-leaf-switcher-closed";
	    } else {
		layerManager.updateLayerContainerMinWidth();
		content.style.display = "none";
		toggleButton.className = className + "-leaf-switcher " + className + "-leaf-switcher-open";
	    }
	}
    }
}

function LeafletLayerTreeOrderManager(className, orderContainer, orderToggleControl, layersContainer, me, layerManager) {
    var me1 = this;
    function redefineIndexes(layerZIndexes) {
	var indexesTmp = new Array();
	for (var layerId in layerZIndexes) {
	    if (layerZIndexes[layerId] != undefined) {
		indexesTmp[layerZIndexes[layerId]] = layerId;
	    }
	}
	var indexes = new Array();
	for (var indexTmp in indexesTmp) {
	    indexes.push(indexesTmp[indexTmp]);
	}
	return indexes;
    }
    this.toggleOrder = function () {
	if (this.isOrderContainerOpen()) {
	    this.closeOrderToggleControl();
	    this.closeOrderContainer();
	    layerManager.openLayersContainer();
	} else {
	    this.openOrderToggleControl();
	    this.openOrderContainer();
	    layerManager.closeLayersContainer();
	}
    };
    this.reorder = function (layerId1, layerId2) {
	var tmpIndexes = redefineIndexes(me._layerZIndexesById);

	var pos1;
	var pos2;

	for (var i = 0; i < tmpIndexes.length; i++) {
	    var currentLayerId = tmpIndexes[i];
	    if (layerId1 == currentLayerId) {
		pos1 = i;
	    } else if (layerId2 == currentLayerId) {
		pos2 = i;
	    }
	}

	var dirFunct;
	if (pos1 > pos2) {
	    dirFunct = function (arr) {
		return arr;
	    };
	} else {
	    dirFunct = function (arr) {
		return arr.reverse();
	    };
	}

	var indexes = new Array();
	var min;
	var max;
	var minLayerId;
	tmpIndexes = dirFunct(tmpIndexes);
	for (var i = 0; i < tmpIndexes.length; i++) {
	    var currentLayerId = tmpIndexes[i];
	    if (currentLayerId == layerId1 || currentLayerId == layerId2) {
		if (min == undefined) {
		    min = i;
		    minLayerId = currentLayerId;
		} else {
		    max = i;
		    indexes.push(minLayerId);
		}
	    }
	    if (min == undefined) {
		indexes.push(tmpIndexes[i]);
	    } else if (max == undefined) {
		indexes.push(tmpIndexes[i + 1]);
	    } else if (i > max) {
		indexes.push(tmpIndexes[i]);
	    }
	}
	indexes = dirFunct(indexes);
	for (var i = 0; i < indexes.length; i++) {
	    me._layerZIndexesById[indexes[i]] = i;
	}
    }
    ;
    this.fillOrders = function () {
	orderContainer.innerHTML = "";
	var indexes = redefineIndexes(me._layerZIndexesById);
	var size = indexes.length;
	for (var index in indexes) {
	    var layerId = indexes[index];
	    var layerContainer = me._layerMenuContainersById[layerId];
	    if (!layerContainer) { // TODO:
		continue;
	    }
	    var prevLayerId = null;
	    var nextLayerId = null;
	    var zIndex = index * 1;
	    if (me._mapLayersById[layerId].setZIndex != undefined) {
		me._mapLayersById[layerId].setZIndex(zIndex);
	    }
	    me._layerZIndexesById[layerId] = zIndex;
	    var layerSettings = me._layerSettingsById[layerId];
	    var row = L.DomUtil.create("div", className + "-order-row", orderContainer);
	    var rowContent = L.DomUtil.create("div", className + "-order-row-content", row);
	    var label = L.DomUtil.create("label", "", rowContent);
	    label.innerHTML = layerSettings.name + " (" + (1 + zIndex) + " of " + size + ")";

	    if (index > 0) {
		prevLayerId = indexes[index * 1 - 1];
		var down = L.DomUtil.create("span", className + "-order-up", rowContent);
		L.DomEvent.on(down, "click", function (event) {
		    var elem = event.currentTarget ? event.currentTarget : me;
		    me1.reorder(elem.parentElement.layerId, elem.parentElement.prevLayerId);
		    me1.fillOrders();
		});
	    }
	    if (index < size - 1) {
		nextLayerId = indexes[index * 1 + 1];
		var up = L.DomUtil.create("span", className + "-order-down", rowContent);
		L.DomEvent.on(up, "click", function (event) {
		    var elem = event.currentTarget ? event.currentTarget : me;
		    me1.reorder(elem.parentElement.layerId, elem.parentElement.nextLayerId);
		    me1.fillOrders();
		});
	    }

	    rowContent.layerId = layerId;
	    rowContent.prevLayerId = prevLayerId;
	    rowContent.nextLayerId = nextLayerId;
	    rowContent.draggable = true;
	    rowContent.droppable = true;
	    rowContent.ondragstart = function (event) {
		var elem = event.currentTarget != undefined ? event.currentTarget : me;
		var sourceId = elem.layerId;
		event.dataTransfer.setData("text/plain", sourceId);
	    };
	    rowContent.ondragover = function (event) {
		var elem = event.currentTarget != undefined ? event.currentTarget : me;
		var sourceId = elem.layerId;
		var targetId = event.dataTransfer.getData("text/plain");
		var sourceIndex = me._layerZIndexesById[sourceId];
		if (sourceIndex != undefined) {
		    event.preventDefault();
		}
	    };
	    rowContent.ondrop = function (event) {
		event.preventDefault();
		var elem = event.currentTarget != undefined ? event.currentTarget : me;
		var sourceId = elem.layerId;
		var targetId = event.dataTransfer.getData("text/plain");
		if (sourceId && targetId) {
		    me1.reorder(sourceId, targetId);
		    me1.fillOrders();
		}
	    }
	}
    };
    return {
	orderContainer: orderContainer,
	orderToggleControl: orderToggleControl,
	layersContainer: layersContainer,
	toggleOrder: this.toggleOrder,
	reorder: this.reorder,
	fillOrders: this.fillOrders,
	isOrderContainerOpen: function () {
	    return orderContainer.classList.contains(className + "-order-open");
	},
	closeOrderContainer: function () {
	    orderContainer.className = className + '-order-closed leaflet-control-layers';
	},
	openOrderContainer: function () {
	    layerManager.updateLayerContainerMinWidth();
	    orderContainer.style.minWidth = layersContainer.style.minWidth;
	    orderContainer.className = className + '-order-open leaflet-control-layers';
	},
	openOrderToggleControl: function () {
	    orderToggleControl.className = className + "-order-toggle-open leaflet-control-layers";
	},
	closeOrderToggleControl: function () {
	    orderToggleControl.className = className + "-order-toggle-closed leaflet-control-layers";
	},
	hideOrderToggleControl: function () {
	    orderToggleControl.className = className + "-order-toggle-hidden leaflet-control-layers";
	}
    }

}

function LeafletLayerTreeLayerManager(className, iconifyToggleControl, layersContainer, me) {
    return {
	iconifyLayersContainerToggleButton: function () {
	    iconifyToggleControl.className = className + "-toggle-closed leaflet-control-layers"
	},
	restoreLayersContainerToggleButton: function () {
	    iconifyToggleControl.className = className + "-toggle-open leaflet-control-layers"
	},
	isLayersContainerOpen: function () {
	    return layersContainer.classList.contains(className + "-layers-open");
	},
	openLayersContainer: function () {
	    layersContainer.className = className + '-layers-open leaflet-control-layers';
	},
	closeLayersContainer: function () {
	    layersContainer.className = className + '-layers-closed leaflet-control-layers';
	},
	updateLayerContainerMinWidth: function () {
	    if (me._minWidth == undefined) {
		me._minWidth = layersContainer.offsetWidth;
	    } else {
		if (me._minWidth < layersContainer.offsetWidth) {
		    me._minWidth = layersContainer.offsetWidth;
		}
	    }
	    layersContainer.style.minWidth = me._minWidth + "px";
	}
    }
}
