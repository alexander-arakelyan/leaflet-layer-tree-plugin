L.Control.LayerTreeControl = L.Control.extend({
    options : {
        position : "topright",
        expand : false,
        className : "leaflet-layer-tree-control",
        openByDefault : false,
        layerBuilders : {},
        featureBuilders : {
            WFS : {}
        }
    },
    initialize : function(options) {
        L.Util.setOptions(this, options);
        if (options.layerTree != undefined) {
            this._layerTree = options.layerTree;
        }
        // this._layers = new Array();
        this._layerSettingsById = {};
        this._layerContainersById = {};
        this._layerIndexesById = {};
        this._childLayers = {};
        this._reloadHandlers = {};
        this._minWidth = undefined;
    },
    onAdd : function(map) {
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

        this.setLayerContainerById2("root", layersContainer);
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

        L.DomEvent.on(icon, "click", function(event) {
            toggleIconify();
        }, this);

        if (!this.options.openByDefault) {
            toggleIconify();
        }

        L.DomEvent.on(order, "click", function(event) {
            orderManager.fillOrders();
            orderManager.toggleOrder();
        });

        var childrenVisibilityToggler = new LeafletLayerTreeLayerChildrenVisibilityToggler(className, layerManager);
        var leafTraverser = this._leafTraverser = new LeafletLayerTreeLeafTraverser(this, className, childrenVisibilityToggler, orderManager);
        this.processLayerTree(me.options.layerTree, layersContainer, layerManager, orderManager, childrenVisibilityToggler, leafTraverser);

        orderManager.fillOrders();
        return container;
    },
    processLayerTree : function(layerTree, layersContainer, layerManager, orderManager, childrenVisibilityToggler, leafTraverser) {
        if (!layerTree) {
            return;
        }
        if (Object.prototype.toString.call(layerTree) === '[object Array]') {
            for ( var i in layerTree) {
                var layerSubTree = layerTree[i];
                leafTraverser.addLeaf(layerSubTree, layersContainer, layerSubTree, "", i, this, orderManager);
            }
        } else {
            leafTraverser.addLeaf(layerTree, layersContainer, layerTree, "", i, this, orderManager);
        }
        delete this._layerTree;
    },
    onRemove : function(map) {

    },
    copyParams : function(layerSettings, exceptions) {
        var params = {};
        for ( var paramKey in layerSettings.params) {
            if (!exceptions || !exceptions.test(paramKey)) {
                params[paramKey] = layerSettings.params[paramKey];
            }
        }
        return params;
    },
    addLayer : function(layerSettings, layerId) {
        console.log("Adding layer [" + layerId + "]");
        // console.log(this._layerSettingsById);
        // console.log(this._layerContainersById);
        if (this._layerContainersById.hasOwnProperty(layerId)) {
            console.log("Layer [" + layerId + "] already exists. Skipping...")
            // console.log(this._layerContainersById);
            return;
        }
        this._layerSettingsById[layerId] = layerSettings;
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
        case "WMS": {
            var params = this.copyParams(layerSettings, /\burl\b/gi);
            var layer = L.tileLayer.wms(layerSettings.params.url, params).addTo(map);
            this._addLayer(layer, layerId, layerSettings);
        }
            break;
        case "WFS": {
            var layers = new L.GeoJSON().addTo(map);
            var params = this.copyParams(layerSettings, /\b(url|style)\b/gi);

            this._addLayer(layers, layerId, layerSettings);
            var wfsHandler = function() {
                var bbox = map.getBounds().toBBoxString();
                if (layerSettings.coordinateSystem) {
                    bbox += "," + layerSettings.coordinateSystem;
                }
                var customParams = {
                    bbox : bbox,
                };
                var params2 = L.Util.extend(params, customParams);
                var wfsUrl = layerSettings.params.url + L.Util.getParamString(params2);
                $.ajax({
                    url : wfsUrl,
                    dataType : 'json',
                    success : function(data) {
                        layers.clearLayers();
                        layers.addData(data);
                        var style = layerSettings.params.style;
                        if (style) {
                            var styleObj = JSON.parse(style);
                            layers.eachLayer(function(layer) {
                                layer.setStyle(styleObj);
                            });
                        }
                        var icon = layerSettings.params.icon;
                        if (icon) {
                            layers.eachLayer(function(layer) {
                                layer.setIcon(icon);
                            });
                        }
                        var onPopup = layerSettings.onPopup;
                        var getType = {};
                        if (onPopup && getType.toString.call(onPopup) === '[object Function]') {
                            layers.eachLayer(function(layer) {
                                var func = layerSettings.onPopup(layer);
                                if (func) {
                                    layer.bindPopup(func);
                                }
                            });
                        }
                    },
                    error : function() {
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
                this._addLayer(layer, layerId, layerSettings);
            }
            break;
        }
    },
    _addLayer : function(layer, layerId, layerSettings) {
        if (layer) {
            var max = 0;
            for ( var propName in this._layerIndexesById) {
                var curr = this._layerIndexesById[propName];
                if (curr > max) {
                    max = curr;
                }
            }
            this._layerIndexesById[layerId] = max + 1;
            this._map.addLayer(layer);
        }
    },
    removeChildLayers : function(layerId) {
        console.log("Removing child layers of [" + layerId + "]");
        if (this._childLayers.hasOwnProperty(layerId)) {
            var children = this._childLayers[layerId];
            for ( var childId in children) {
                this.removeChildLayers(childId);
                this.removeLayer(childId);
            }
        }
        this.removeLayer(layerId);
    },
    removeLayer : function(layerId) {
        console.log("Removing layer [" + layerId + "]");
        if (this._layerSettingsById.hasOwnProperty(layerId)) {
            var map = this._map;
            var layerIndex = this._layerIndexesById[layerId];
            delete layerIndex;
            delete this._layerIndexesById[layerId];
            if (this._reloadHandlers.hasOwnProperty(layerId + "__moveend")) {
                map.off("moveend", this._reloadHandlers[layerId + "__moveend"]);
                delete this._reloadHandlers[layerId + "__moveend"];
            }
            if (this._layerContainersById.hasOwnProperty(layerId)) {
                console.log("Deleting layerContainer for [" + layerId + "]")
                var layerContainer = this._layerContainersById[layerId];
                map.removeLayer(layerContainer);
                delete this._layerContainersById[layerId];
            }
        }
    },
    addLayer2 : function(layerSettings, parentLayerId) {
        // find parent layer,
        console.log("AddLayer2 [" + parentLayerId + "][" + layerSettings.code + "]");
        var parentLayerSettings;
        if (parentLayerId) {
            parentLayerSettings = this._layerSettingsById[parentLayerId];
            if (!parentLayerSettings) {
                throw "Cannot find [" + parentLayerId + "] layer settings.";
            }
        } else {
            parentLayerId = "root";
            parentLayerSettings = {
                name : "Root",
                active : true,
                selectType : "NONE",
                openByDefault : true
            };
            this._layerSettingsById[parentLayerId] = parentLayerSettings;
        }

        // add layer to parent
        let parentContainer = this.getLayerContainerById2(parentLayerId);
        console.log("AddLayer2 parentContainer [" + parentLayerId + "][" + layerSettings.code + "]");
        console.log(parentContainer);
        var parentContainerContent = (parentContainer //
                && parentContainer.childNodes //
                && parentContainer.childNodes.length >= 2 //
        && parentContainer.childNodes[1].className == className //
                + "-leaf-content") //
        ? parentContainer.childNodes[1] //
        : parentContainer;

        // console.log(parentContainer);
        var leafId = this._leafTraverser.addLeaf(parentLayerSettings, parentContainerContent, layerSettings, parentLayerId, 0);
        console.log("Adding settings for [" + leafId + "]")
        // console.log(layerSettings);
        this._layerSettingsById[leafId] = layerSettings;
        this.setChildLayer(leafId, parentLayerId);
        return leafId;
    },
    removeLayer2 : function(layerId) {
        // find layer
        var layerTree = this._findLayerSettings(layerId);

        // remove layer
        this._leafTraverser.removeLeaf(layerId);
    },
    getLayerContainerById2 : function(layerId) {
        console.log("LayerId [" + layerId + "]");
        // console.log(this._layerContainersById);
        var layerContainer = this._layerContainersById[layerId];
        // console.log(layerContainer);
        return layerContainer;
    },
    setLayerContainerById2 : function(layerId, layerContainer) {
        console.log("New leaf [" + layerId + "]");
        if (this._layerContainersById.hasOwnProperty(layerId)) {
            console.log("WARNING: LayerContainer for " + layerId + " already exists.");
        }
        console.log(layerContainer)
        this._layerContainersById[layerId] = layerContainer;
    },
    setChildLayer : function(layerId, parentLayerId) {
        if (!this._childLayers.hasOwnProperty(parentLayerId)) {
            this._childLayers[parentLayerId] = {};
        }
        console.log("Setting child layer [" + parentLayerId + "][" + layerId + "]");
        this._childLayers[parentLayerId][layerId] = {}
    },
    removeChildLayer : function(layerId, parentLayerId) {
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
        prepare : function prepare(layerId, parentId, parentLeaf, leafTitle, leaf, me, orderManager) {

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
                        for ( var i in childIds) {
                            var childId = childIds[i];
                            toggleLayerMULTIPLE(childId, state);
                            updateCheckboxState(childId, state);
                        }
                        me.addLayer(layerSettings[elementId], elementId);
                    } else if (state == INCLUDE_SELF) {
                        me.addLayer(leaf, elementId);
                        // updateCheckboxState(elementId, INCLUDE_SELF);
                    } else {
                        var childIds = childrenCheckboxes[elementId];
                        for ( var i in childIds) {
                            var childId = childIds[i];
                            toggleLayerMULTIPLE(childId, state);
                            updateCheckboxState(childId, state);
                        }
                        me.removeLayer(elementId);
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

            L.DomEvent.on(checkbox, "click", function(event) {
                advanceState.call(this, event);
            });
            L.DomEvent.on(label, "click", function(event) {
                advanceState.call(this, event);
            });
            if (leaf.selectedByDefault) {
                updateCheckboxState0(checkbox, INCLUDE_SELF);
                toggleLayerMULTIPLE(layerId, checkbox.value, leafTitle);
            }

            return parentLeafCode;
        },
        clearChildCheckboxCounter : function() {
            childrenCheckboxes = {};
            layerSettings = {};
            layers = {};
        },
        incrementChildrenCheckbox : function(parentId, childId, leaf) {
            if (!childrenCheckboxes.hasOwnProperty(parentId)) {
                childrenCheckboxes[parentId] = new Array();
            }
            childrenCheckboxes[parentId].push(childId);
            layerSettings[childId] = leaf;
            layers[childId] = {
                parentId : parentId
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
        buildLeafId : function(parentId, leafSettings, order) {
            return parentId + "_" + leafSettings.code + "_" + order;
        },
        addLeaf : function(parentLeafSettings, parentContainer, leafSettings, parentLeafId, leafOrder) {
            // console.log("ParentContainer:");
            // console.log(parentContainer);
            var leafContainer = L.DomUtil.create("div", className + "-leaf", parentContainer);
            var leafHeader = L.DomUtil.create("div", className + "-leaf-header", leafContainer);
            var leafTitle = L.DomUtil.create("span", className + "-leaf-title", leafHeader);
            createSwitcher(/* leafSettings, */parentLeafId, className, leafHeader);

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
                    for ( var i in featureBuilders) {
                        var featureBuilder = featureBuilders[i];
                        featureBuilder(leafTitle, leafSettings, thePlugin.options, thePlugin._map);
                    }
                }
                var leafContent = L.DomUtil.create("div", className + "-leaf-content", leafContainer);
                if (leafSettings.childLayers && leafSettings.childLayers.length > 0) {
                    for ( var i in leafSettings.childLayers) {
                        var childleafSettings = leafSettings.childLayers[i];
                        if (childleafSettings) {
                            this.addLeaf(leafSettings, leafContent, childleafSettings, leafId, i);
                        }
                    }
                }
                console.log("Leaf container for [" + leafSettings.code + "]");
                // console.log(parentContainer);
                // console.log(leafContainer);
                // console.log(leafContainer.parentNode);
                // console.log(leafContainer.parentNode.parentNode);
                if (leafContainer.parentNode && leafContainer.parentNode.parentNode) {
                    console.log("Toggle children for [" + leafId + "]");
                    childrenVisibilityToggler.toggleChildrenVisibility(leafContainer.parentNode.parentNode, parentLeafSettings.openByDefault);
                } else {
                    console.log("Children toggle disabled for [" + leafId + "]");
                }
            }
            thePlugin.setLayerContainerById2(leafId, leafContainer);
            return leafId;
        },
        removeLeaf : function(leafId) {

        }
    }

    function createSwitcher(/* leafSettings, */parentLeafId, className, leafHeader) {
        // if (leafSettings.childLayers != undefined &&
        // leafSettings.childLayers.length > 0)
        {
            console.log("Adding switcher for [" + parentLeafId + "]");
            var leafSwitcherRow = L.DomUtil.create("span", className + "-leaf-switcher-row", leafHeader);
            var leafSwitcher = L.DomUtil.create("span", className + "-leaf-switcher", leafSwitcherRow);
            L.DomEvent.on(leafSwitcher, "click", function(event) {
                var elem = event.srcElement != undefined ? event.srcElement : this;
                console.log(elem.parentElement.parentElement.parentElement);
                childrenVisibilityToggler.toggleChildrenVisibility(elem.parentElement.parentElement.parentElement);
            });
        }
    }

    function createMULTIPLELeaf(leafId, parentLeafId, parentLeafSettings, leafTitle, leafSettings) {
        console.log("Leaf MULTIPLE [" + leafSettings.name + "]");
        checkboxWrapper.prepare(leafId, parentLeafId, parentLeafSettings, leafTitle, leafSettings, thePlugin, orderManager);
        checkboxWrapper.incrementChildrenCheckbox(parentLeafId, leafId, leafSettings);
    }

    function createSINGLELeaf(leafSettings, leafTitle, parentLeafSettings, leafId, parentLeafId, thePlugin, orderManager) {
        console.log("Leaf SINGLE [" + leafSettings.name + "]");

        function toggleLayerSINGLE(parentElementId, sourceElementId, leafTitle) {
            thePlugin.removeChildLayers(parentElementId);
            thePlugin.addLayer(leafSettings, sourceElementId);
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
        L.DomEvent.on(checkbox, "change", function(event) {
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
        L.DomEvent.on(label, "click", function(event) {
            var elem = event.srcElement != undefined ? event.srcElement : this;
            var checkbox = elem.parentElement.parentElement.getElementsByTagName("input")[0];
            checkbox.checked = true;
            var parentElementId = checkbox.parentId;
            var sourceElementId = checkbox.id;
            toggleLayerSINGLE(parentElementId, sourceElementId);
        });
        if (leafSettings.selectedByDefault) {
            toggleLayerSINGLE(parentLeafId, leafId);
        }
    }

    function createNONELeaf(leafSettings, leafTitle) {
        console.log("Leaf NONE [" + leafSettings.name + "]");
        leafTitle.innerHTML = "<label>" + leafSettings.name + "</label>";
    }
}

function LeafletLayerTreeLayerChildrenVisibilityToggler(className, layerManager) {
    this.className = className;

    function checkIfParentIsHeader(elem) {
        // console.log(elem);
        // console.log(elem.childNodes.length);
        console.log(elem.className);
        console.log(elem.childNodes[0].className);
        var childNodesGreaterThanTwo = elem.childNodes.length >= 2;
        if (!childNodesGreaterThanTwo) {
            console.log("Toggle: container < 2")
            return false;
        }
        var headerNodeExists = elem.childNodes[0].className == className + "-leaf-header";
        var contentNodeExists = elem.childNodes[1].className == className + "-leaf-content";
        console.log("Header node " + headerNodeExists + ", content node " + contentNodeExists);
        return headerNodeExists && contentNodeExists;
    }

    // Layers
    return {
        toggleChildrenVisibility : function(elem, open) {
            console.log("Toggling..." + open);
            if (!checkIfParentIsHeader(elem)) {
                return;
            }
            var header = elem.childNodes[0];
            var content = elem.childNodes[1];
            var switcherRow = header.getElementsByClassName(className + "-leaf-switcher-row");
            if (switcherRow.length != 1) {
                console.log("Switcher not found");
                return;
            }
            var toggleButtons = switcherRow[0].getElementsByClassName(className + "-leaf-switcher");
            if (toggleButtons.length != 1) {
                console.log("Toggle not found");
                return;
            }
            console.log("Toggle");
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
    this.toggleOrder = function() {
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
    function findLayerIdByIndex(nextIndex) {
        for ( var id in me._layerIndexesById) {
            if (me._layerIndexesById[id] == nextIndex) {
                return id;
            }
        }
    }
    this.reorder = function(layerId, direction) {
        var currentIndex = me._layerIndexesById[layerId];
        var nextIndex = currentIndex + direction;
        var nextLayerId = findLayerIdByIndex(nextIndex);
        console.log("Reorder [" + layerId + "][" + direction + "]")
        if (nextLayerId) {
            me._layerIndexesById[layerId] = nextIndex;
            me._layerIndexesById[nextLayerId] = currentIndex;
        }
    };
    this.reorderIndexes = function(down, up) {
        var downLayerId = findLayerIdByIndex(down);
        if (!downLayerId) {
            return;
        }
        var upLayerId = findLayerIdByIndex(up);
        if (!upLayerId) {
            return;
        }
        me._layerIndexesById[downLayerId] = up;
        me._layerIndexesById[upLayerId] = down;
    }
    this.fillOrders = function() {
        orderContainer.innerHTML = "";
        var layerIndexes = me._layerIndexesById;
        var size = 0;
        for ( var n in layerIndexes) {
            size++;
        }
        var indexes = new Array();
        for ( var layerId in layerIndexes) {
            indexes[layerIndexes[layerId]] = layerId;
        }
        for ( var index in indexes) {
            var layerId = indexes[index];
            var layerIndex = layerIndexes[layerId];
            var layerContainer = me._layerContainersById[layerId];
            if (!layerContainer) { // TODO:
                continue;
            }
            // console.log(me)
            // console.log(me._layerContainersById);
            // console.log(layerId);
            // console.log(layerContainer);
            if (layerContainer.setZIndex != undefined) {
                layerContainer.setZIndex(layerIndex);
            }
            var layerSettings = me._layerSettingsById[layerId];
            var row = L.DomUtil.create("div", className + "-order-row", orderContainer);
            var rowContent = L.DomUtil.create("div", className + "-order-row-content", row);
            var label = L.DomUtil.create("label", "", rowContent);
            label.innerHTML = layerSettings.name + " (" + layerIndex + " of " + size + ")";

            if (layerIndex > 1) {
                var down = L.DomUtil.create("span", className + "-order-up", rowContent);
                L.DomEvent.on(down, "click", function(event) {
                    console.log(event);
                    var elem = event.currentTarget ? event.currentTarget : me;
                    console.log(elem);
                    var layerId = elem.parentElement.layerId;
                    me1.reorder(layerId, -1);
                    me1.fillOrders();
                });
            }
            if (layerIndex < size) {
                var up = L.DomUtil.create("span", className + "-order-down", rowContent);
                L.DomEvent.on(up, "click", function(event) {
                    var elem = event.currentTarget ? event.currentTarget : me;
                    var layerId = elem.parentElement.layerId;
                    me1.reorder(layerId, 1);
                    me1.fillOrders();
                });
            }

            rowContent.layerId = layerId;
            rowContent.draggable = true;
            rowContent.droppable = true;
            rowContent.ondragstart = function(event) {
                var elem = event.currentTarget != undefined ? event.currentTarget : me;
                var sourceId = elem.layerId;
                event.dataTransfer.setData("text/plain", sourceId);
            };
            rowContent.ondragover = function(event) {
                var elem = event.currentTarget != undefined ? event.currentTarget : me;
                var sourceId = elem.layerId;
                var targetId = event.dataTransfer.getData("text/plain");
                var sourceIndex = me._layerIndexesById[sourceId];
                if (sourceIndex != undefined) {
                    event.preventDefault();
                }
            };
            rowContent.ondrop = function(event) {
                event.preventDefault();
                var elem = event.currentTarget != undefined ? event.currentTarget : me;
                var sourceId = elem.layerId;
                var targetId = event.dataTransfer.getData("text/plain");
                var sourceIndex = me._layerIndexesById[sourceId];
                var targetIndex = me._layerIndexesById[targetId];
                if (sourceIndex != undefined && targetIndex != undefined && sourceIndex != targetIndex) {
                    me1.reorderIndexes(targetIndex, sourceIndex);
                    me1.fillOrders();
                }
            }
        }
    };
    return {
        orderContainer : orderContainer,
        orderToggleControl : orderToggleControl,
        layersContainer : layersContainer,
        toggleOrder : this.toggleOrder,
        reorder : this.reorder,
        fillOrders : this.fillOrders,
        isOrderContainerOpen : function() {
            return orderContainer.classList.contains(className + "-order-open");
        },
        closeOrderContainer : function() {
            orderContainer.className = className + '-order-closed leaflet-control-layers';
        },
        openOrderContainer : function() {
            layerManager.updateLayerContainerMinWidth();
            orderContainer.style.minWidth = layersContainer.style.minWidth;
            orderContainer.className = className + '-order-open leaflet-control-layers';
        },
        openOrderToggleControl : function() {
            orderToggleControl.className = className + "-order-toggle-open leaflet-control-layers";
        },
        closeOrderToggleControl : function() {
            orderToggleControl.className = className + "-order-toggle-closed leaflet-control-layers";
        },
        hideOrderToggleControl : function() {
            orderToggleControl.className = className + "-order-toggle-hidden leaflet-control-layers";
        }
    }

}

function LeafletLayerTreeLayerManager(className, iconifyToggleControl, layersContainer, me) {
    return {
        iconifyLayersContainerToggleButton : function() {
            iconifyToggleControl.className = className + "-toggle-closed leaflet-control-layers"
        },
        restoreLayersContainerToggleButton : function() {
            iconifyToggleControl.className = className + "-toggle-open leaflet-control-layers"
        },
        isLayersContainerOpen : function() {
            return layersContainer.classList.contains(className + "-layers-open");
        },
        openLayersContainer : function() {
            layersContainer.className = className + '-layers-open leaflet-control-layers';
        },
        closeLayersContainer : function() {
            layersContainer.className = className + '-layers-closed leaflet-control-layers';
        },
        updateLayerContainerMinWidth : function() {
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
