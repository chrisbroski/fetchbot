/*jslint browser: true, sloppy: true */
/*global io */

var socket, canvasEdge, ctxEdge, canvasBall, ctxBall, viewWidth, mag, halfMag, width, stateHash = 0, control = 'auto', manualOverrideTimer, canvasLuma, ctxLuma, canvasChromaU, ctxChromaU, canvasChromaV, ctxChromaV, layers, detectors, actionData;

layers = ["luma", "chromaU", "chromaV", "edges", "target"];

function displayOverallBrightness(brightnessNormalized) {
    var brightnessAmplified = brightnessNormalized + 0.1,
        rgbaShade,
        brightnessDiv = document.getElementById('brightness');

    if (brightnessAmplified > 1.0) {
        brightnessAmplified = 1.0;
    }
    rgbaShade = 'rgba(255, 255, 255, ' + brightnessAmplified + ')';
    brightnessDiv.style.backgroundColor = rgbaShade;
}

function displayEdges(edges) {
    ctxEdge.clearRect(0, 0, canvasEdge.width, canvasEdge.height);

    edges.forEach(function (edge) {
        var x = (edge % width) * mag,
            y = (Math.floor(edge / width)) * mag,
            gradient = ctxEdge.createRadialGradient(x, y, 0, x, y, mag * 1.5);

        ctxEdge.beginPath();
        gradient.addColorStop(0, 'black');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, 'transparent');
        ctxEdge.arc(x, y, mag * 1.5, 0, 2 * Math.PI);

        ctxEdge.fillStyle = gradient;
        ctxEdge.fill();
    });
}

function displayTargets(hits) {
    ctxBall.clearRect(0, 0, canvasEdge.width, canvasEdge.height);

    hits.forEach(function (hit) {
        var x = (hit % (width / 2)) * mag * 2,
            y = (Math.floor(hit / (width / 2))) * mag * 2,
            size = mag * 2;

        ctxBall.beginPath();
        ctxBall.fillRect(x, y, size, size);
        ctxBall.closePath();
        ctxBall.fill();
    });
}

function setViewOptions(width) {
    viewWidth = width;
    mag = canvasEdge.width / width;
    halfMag = mag / 2;
}

function disableControlButtons(disOrEnable) {
    var buttons = document.querySelectorAll('#controls button, #actions button'), ii, len;
    len = buttons.length;
    for (ii = 0; ii < len; ii += 1) {
        buttons[ii].disabled = disOrEnable;
    }
}

function setControl(autoOrManual) {
    var controlButton = document.querySelector('#manual button');

    control = autoOrManual;
    if (control === 'manual') {
        document.querySelector('#manual button').innerHTML = 'Relinquish control';
        disableControlButtons(false);
    } else {
        document.querySelector('#manual button').innerHTML = 'Request manual control';
        disableControlButtons(true);
    }

    controlButton.disabled = false;
    //disableControlButtons(disOrEnabled);
}

function describeAction(action) {
    return action[0] + ": " + action[1] + " " + JSON.stringify(action[2]);
}

function displayRaw(raw) {
    raw = JSON.parse(raw);

    ctxLuma.clearRect(0, 0, canvasEdge.width, canvasEdge.height);
    raw.luma.forEach(function (dot, index) {
        var x = (index % width) * mag,
            y = (Math.floor(index / width)) * mag,
            size = mag;

        ctxLuma.fillStyle = "rgba(" + dot + ", " + dot + ", " + dot + ", 0.5)";
        ctxLuma.beginPath();
        ctxLuma.fillRect(x, y, size, size);
        ctxLuma.closePath();
        ctxLuma.fill();
    });

    ctxChromaU.clearRect(0, 0, canvasEdge.width, canvasEdge.height);
    raw.chromaU.forEach(function (dot, index) {
        var x = (index % (width / 2)) * mag * 2,
            y = (Math.floor(index / (width / 2))) * mag * 2,
            size = mag * 2;

        ctxChromaU.fillStyle = "rgba(0, 0, 255, " + (dot / 512) + ")";
        ctxChromaU.beginPath();
        ctxChromaU.fillRect(x, y, size, size);
        ctxChromaU.closePath();
        ctxChromaU.fill();
    });

    ctxChromaV.clearRect(0, 0, canvasEdge.width, canvasEdge.height);
    raw.chromaV.forEach(function (dot, index) {
        var x = (index % (width / 2)) * mag * 2,
            y = (Math.floor(index / (width / 2))) * mag * 2,
            size = mag * 2;

        ctxChromaV.fillStyle = "rgba(255, 0, 0, " + (dot / 512) + ")";
        ctxChromaV.beginPath();
        ctxChromaV.fillRect(x, y, size, size);
        ctxChromaV.closePath();
        ctxChromaV.fill();
    });
}

function clearDetectors() {
    var detectorRadios = document.querySelectorAll('#behaviorEdit div:first-child input[type="radio"]');
    Array.from(detectorRadios).forEach(function (cb) {
        cb.checked = !cb.value;
    });
    document.getElementById("action-type").selectedIndex = 0;
}

function createRadio(name, val) {
    var detectorLabel = document.createElement("label"),
        detectorInput = document.createElement("input");
    detectorInput.type = "radio";
    detectorInput.name = "di-" + name;
    detectorInput.value = val;
    detectorInput.checked = true;
    detectorLabel.appendChild(detectorInput);
    detectorLabel.appendChild(document.createTextNode(val || "-"));

    return detectorLabel;
}

function displayDetectors(ds) {
    var detectorArea,
        detectorRow;

    detectorArea = document.querySelector("#behaviorEdit div");
    Object.keys(ds).forEach(function (d) {
        detectorRow = document.createElement("div");
        detectorRow.setAttribute("data-detector", d);

        detectorRow.appendChild(createRadio(d, ""));
        detectorRow.appendChild(createRadio(d, "1"));
        detectorRow.appendChild(createRadio(d, "0"));
        detectorRow.appendChild(document.createTextNode(d));
        detectorArea.appendChild(detectorRow);
    });
}

function senseStateReceived(senseState) {
    var jsonState = JSON.parse(senseState),
        jsonString,
        currentAction;

    if (!detectors) {
        detectors = true;
        displayDetectors(jsonState.detectors);
    }

    width = jsonState.perceptions.dimensions[0];
    mag = 400 / width;
    halfMag = mag / 2;
    currentAction = jsonState.currentAction;
    document.getElementById("current-action").textContent = describeAction(currentAction);
    delete jsonState.currentAction;
    jsonString = JSON.stringify(jsonState, null, '    ');

    // only update screen if data is new
    //if (hashCode(jsonString) !== stateHash) {
    //stateHash = hashCode(jsonString);

    // Handle image dimension change
    if (viewWidth !== jsonState.perceptions.dimensions[0]) {
        setViewOptions(jsonState.perceptions.dimensions[0]);
    }

    document.querySelector('#senseState').innerHTML = jsonString;
    //displayOverallBrightness(jsonState.perceptions.brightnessOverall);
    displayEdges(jsonState.perceptions.edges);
    displayTargets(jsonState.perceptions.targets);
    //}
}

function isSelectedParam(paramDesc, selectedParams) {
    if (!selectedParams) {
        return false;
    }
    return (paramDesc === selectedParams.type);
}

function displayActionParams(selectedParams) {
    var actionType = document.getElementById("action-type").value,
        actionParam = document.getElementById("action-param"),
        actionInfo = actionType.split("-"),
        paramData = actionData[actionInfo.shift()][actionInfo.join("-")],
        paramLabel,
        paramInput,
        paramOption;

    actionParam.innerHTML = "";
    if (typeof paramData === "string") {
        return;
    }
    paramData.forEach(function (param) {
        paramLabel = document.createElement("label");
        paramLabel.textContent = param.description;
        if (param.values) {
            paramInput = document.createElement("select");
            param.values.forEach(function (val) {
                paramOption = document.createElement("option");
                paramOption.textContent = val;
                paramOption.value = val;
                if (isSelectedParam(val, selectedParams)) {
                    paramOption.selected = true;
                }
                paramInput.appendChild(paramOption);
            });
        } else if (param.options) {
            paramInput = document.createElement("select");
            param.options.forEach(function (val) {
                paramOption = document.createElement("option");
                paramOption.textContent = val;
                paramOption.value = val;

                if (isSelectedParam(val, selectedParams) || param.auto === val) {
                    paramOption.selected = true;
                }
                paramInput.appendChild(paramOption);
            });
        } else {
            paramInput = document.createElement("input");
            paramInput.setAttribute("type", "number");

            if (selectedParams && selectedParams[param.description]) {
                paramInput.value = selectedParams[param.description];
            } else {
                paramInput.value = param.auto;
            }

            paramInput.setAttribute("min", param.val[0]);
            paramInput.setAttribute("max", param.val[1]);
            if (param.val[0] === 0.0 && param.val[1] === 1.0) {
                paramInput.setAttribute("step", "0.01");
            }

        }
        paramLabel.appendChild(paramInput);
        actionParam.appendChild(paramLabel);
    });
}

function isActParamsValues(params) {
    return params.find(function (param) {
        return param.values;
    });
}

function manualAction() {
    var actGroup = this.parentElement,
        actType = actGroup.getAttribute("data-action-type"),
        paramInputs = actGroup.getElementsByTagName("input"),
        paramSelects = actGroup.getElementsByTagName("select"),
        actionName = this.textContent,
        paramData = {};

    Array.from(paramSelects).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = inp.value;
    });
    Array.from(paramInputs).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = +inp.value;
    });
    if (this.getAttribute("data-action")) {
        paramData[this.getAttribute("data-action-param")] = actionName;
        actionName = this.getAttribute("data-action");
    }
    window.console.log(actType, actionName, paramData);
    socket.emit("action", JSON.stringify([actType, actionName, paramData]));
}

function actionParamFragment(act, params) {
    var actFragment = document.createDocumentFragment(),
        label,
        button,
        select,
        option,
        input,
        isButtonSeries = params.some(function (param) {return param.values; });

    params.forEach(function (param, index) {
        if (index === 0 && !isButtonSeries) {
            button = document.createElement("button");
            button.textContent = act;
            button.onclick = manualAction;
            button.disabled = true;
            actFragment.appendChild(button);
        }

        if (param.values) {
            // This is got a "button set"
            param.values.forEach(function (val) {
                button = document.createElement("button");
                button.textContent = val;
                button.setAttribute("data-action", act);
                button.setAttribute("data-action-param", param.description);
                button.onclick = manualAction;
                button.disabled = true;
                actFragment.appendChild(button);
            });
        }
        if (param.options) {
            select = document.createElement("select");
            select.setAttribute("data-action-param", param.description);
            param.options.forEach(function (opt) {
                option = document.createElement("option");
                option.textContent = opt;
                option.value = opt;
                select.appendChild(option);
            });
            actFragment.appendChild(select);
        }
        if (param.val) {
            label = document.createElement("label");
            label.textContent = param.description;
            input = document.createElement("input");
            input.setAttribute("type", "number");
            input.setAttribute("data-action-param", param.description);
            input.value = param.auto;
            input.setAttribute("min", param.val[0]);
            input.setAttribute("max", param.val[1]);
            if (param.val[0] === 0.0 && param.val[1] === 1.0) {
                input.setAttribute("step", "0.01");
            }
            label.appendChild(input);
            actFragment.appendChild(label);
        }
    });

    return actFragment;
}

function displayActions(actions) {
    var actionSelect = document.createElement("select"),
        actionOption,
        actionOptionGroup,
        actionSection = document.getElementById("actions"),
        actionDiv,
        actionH,
        actionParam = document.createElement("div"),
        tmpPre = document.createElement("pre");

    actionData = JSON.parse(actions);
    actionSelect.id = "action-type";
    actionSelect.onchange = displayActionParams;

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "perform";
    Object.keys(actionData.perform).forEach(function (act) {
        // Actions section
        actionDiv = document.createElement("fieldset");
        actionDiv.setAttribute("data-action-type", "perform");
        actionH = document.createElement("h4");
        actionH.textContent = act;
        actionDiv.appendChild(actionH);
        actionDiv.appendChild(actionParamFragment(act, actionData.perform[act]));
        actionSection.appendChild(actionDiv);

        // Behavior popup
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = "perform-" + act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "maneuver";
    Object.keys(actionData.maneuver).forEach(function (act) {
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = "maneuver-" + act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    document.querySelector("#behaviorActions").appendChild(actionSelect);
    actionParam.id = "action-param";
    document.querySelector("#behaviorActions").appendChild(actionParam);

    tmpPre.textContent = JSON.stringify(actionData, null, "    ");
    document.querySelector("#behaviorActions").appendChild(tmpPre);

    displayActionParams();
}

function populateBehavior(data) {
    clearDetectors();
    // var behaviorData = this.textContent,
    var detector = data.slice(0, data.indexOf(" ")),
        response = JSON.parse(data.slice(data.indexOf("[")));

    // This will need to handle multiple detectors and false values
    if (detector !== "default") {
        document.querySelector('#behaviorEdit div[data-detector="' + detector + '"] input[value="1"]').checked = true;
    } else {
        Array.from(document.querySelectorAll('#behaviorEdit div input[value=""]')).forEach(function (d) {
            d.checked = true;
        });
    }

    // Actions
    document.querySelector("#action-type").value = response[0] + '-' + response[1];
    displayActionParams(response[2]);

    document.getElementById("behaviorEdit").showModal();
}

function displayBehaviors(behaviorTable) {
    var behaviors,
        bTable = document.getElementById("behaviorTable"),
        bTableRow;

    if (behaviorTable) {
        behaviors = JSON.parse(behaviorTable);
    } else {
        behaviors = [];
    }

    behaviors.forEach(function (behavior, index) {
        var detectTrue = [], detectFalse = [], sit;
        Object.keys(behavior.situation).forEach(function (d) {
            if (behavior.situation[d]) {
                detectTrue.push(d);
            } else {
                detectFalse.push(d);
            }
        });
        if (detectTrue.length === 0 && detectFalse.length === 0) {
            sit = "default";
        } else {
            if (detectTrue.length > 0) {
                sit = detectTrue.join(", ") + " ";
            }
            if (detectFalse.length > 0) {
                sit = sit + "(" + detectFalse.join(", ") + ")";
            }
        }
        bTableRow = document.createElement("option");
        bTableRow.value = index;
        bTableRow.textContent = sit + " : " + JSON.stringify(behavior.response);
        bTableRow.ondblclick = function () {
            populateBehavior(this.textContent);
        };
        bTable.appendChild(bTableRow);
    });
}

function manual() {
    var controlButton = document.querySelector('#manual button');

    controlButton.disabled = true;

    if (control === 'auto') {
        controlButton.innerHTML = 'Requesting manual control...';
        socket.emit('control', 'manual');
        setControl('manual');
    } else {
        controlButton.innerHTML = 'Requesting autonomous control...';
        socket.emit('control', 'auto');
        setControl('auto');
    }
}

function displayParams(params, paramType) {
    var senseParamDiv = document.getElementById(paramType + "Params"),
        fieldset = document.createElement("fieldset");

    params = JSON.parse(params);

    Object.keys(params).forEach(function (perceiver) {
        var h4 = document.createElement("h4");
        h4.textContent = perceiver;
        fieldset.appendChild(h4);

        Object.keys(params[perceiver]).forEach(function (param) {
            var label = document.createElement("label"),
                input = document.createElement("input"),
                button = document.createElement("button");

            label.textContent = param;
            input.type = "number";
            input.value = params[perceiver][param];
            input.onchange = function () {
                socket.emit("setsenseParam", perceiver + "," + param + "," + this.value);
            };

            button.type = "button";
            button.textContent = "Update";

            label.appendChild(input);
            label.appendChild(button);
            fieldset.appendChild(label);
        });

        senseParamDiv.appendChild(fieldset);
    });
}

function displaySenseParams(params) {
    displayParams(params, "sense");
}

function checkLayers() {
    layers.forEach(function (layer) {
        var check = document.getElementById("layer-" + layer);
        document.getElementById(layer).style.display = (check.checked) ? "block" : "none";
    });
}

function init() {
    disableControlButtons(true);
    document.getElementById("newBehavior").onclick = function () {
        clearDetectors();
        document.getElementById("behaviorEdit").showModal();
    };
    document.getElementById("closeBehaviorEdit").onclick = function () {
        document.getElementById("behaviorEdit").close();
    };
    document.getElementById("saveBehavior").onclick = function () {
        // socket call
    };

    layers.forEach(function (layer) {
        document.getElementById("layer-" + layer).onclick = checkLayers;
    });
    checkLayers();

    socket = io({reconnection: false});

    canvasEdge = document.getElementById("edges");
    ctxEdge = canvasEdge.getContext("2d");

    canvasBall = document.getElementById('target');
    ctxBall = canvasBall.getContext("2d");
    ctxBall.fillStyle = "rgba(255, 0, 0, 0.5)";

    canvasLuma = document.getElementById("luma");
    ctxLuma = canvasLuma.getContext("2d");
    canvasChromaU = document.getElementById("chromaU");
    ctxChromaU = canvasChromaU.getContext("2d");
    canvasChromaV = document.getElementById("chromaV");
    ctxChromaV = canvasChromaV.getContext("2d");

    socket.on("senseState", senseStateReceived);
    socket.on("senseRaw", displayRaw);
    socket.on("actions", displayActions);
    socket.on("behaviors", displayBehaviors);
    socket.on("getSenseParams", displaySenseParams);
    socket.on("getActionParams", displayActionParams);
    socket.on("disconnect", function () {
        window.console.log('disconnected');
    });
}

init();
