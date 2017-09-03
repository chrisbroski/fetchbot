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
    var buttons = document.querySelectorAll('#controls button'), ii, len;
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
    /*if (action && action.type) {
        return action.type + ': ' + action.parameters.join(", ");
    }*/
    return JSON.stringify(action);
    //return "none";
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

function displayDetectors(ds) {
    var detectorArea,
        detectorRow,
        detectorLabel,
        detectorInput;

    detectorArea = document.querySelector("#behaviorEdit div");
    Object.keys(ds).forEach(function (d) {
        detectorRow = document.createElement("div");
        //detectorRow.textContent = d + ": " + jsonState.ds[d];

        detectorLabel = document.createElement("label");
        detectorInput = document.createElement("input");
        detectorInput.type = "radio";
        detectorInput.name = "di-" + d;
        detectorInput.value = "";
        detectorInput.checked = true;
        detectorLabel.appendChild(detectorInput);
        detectorLabel.appendChild(document.createTextNode("-"));
        detectorRow.appendChild(detectorLabel);

        detectorLabel = document.createElement("label");
        detectorInput = document.createElement("input");
        detectorInput.type = "radio";
        detectorInput.name = "di-" + d;
        detectorInput.value = "1";
        detectorLabel.appendChild(detectorInput);
        detectorLabel.appendChild(document.createTextNode("1"));
        detectorRow.appendChild(detectorLabel);

        detectorLabel = document.createElement("label");
        detectorInput = document.createElement("input");
        detectorInput.type = "radio";
        detectorInput.name = "di-" + d;
        detectorInput.value = "0";
        detectorLabel.appendChild(detectorInput);
        detectorLabel.appendChild(document.createTextNode("0"));
        detectorRow.appendChild(detectorLabel);

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

function displayMoods(moodString) {
    var moodData = JSON.parse(moodString),
        moodSelect = document.createElement("select"),
        moodOption,
        moodContainer = document.getElementById('moods');

    Object.keys(moodData).forEach(function (mood, index) {
        moodOption = document.createElement('option');
        moodOption.value = mood;
        if (index === 0) {
            moodOption.textContent = "Default (" + mood + ")";
        } else {
            moodOption.textContent = mood + " (" + moodData[mood] + "s)";
        }

        moodSelect.appendChild(moodOption);
    });
    moodContainer.innerHTML = "";
    moodContainer.appendChild(moodSelect);
}

function displayActions(actions) {
    window.console.log('displayActions');
    var actionSelect = document.createElement("select"),
        actionOption,
        actionOptionGroup,
        tmpPre = document.createElement("pre");

    actionData = JSON.parse(actions);

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "perform";
    Object.keys(actionData.perform).forEach(function (act) {
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    actionOptionGroup = document.createElement("optgroup");
    actionOptionGroup.label = "maneuver";
    Object.keys(actionData.maneuver).forEach(function (act) {
        actionOption = document.createElement("option");
        actionOption.textContent = act;
        actionOption.value = act;
        actionOptionGroup.appendChild(actionOption);
    });
    actionSelect.appendChild(actionOptionGroup);

    document.querySelector("#behaviorActions").appendChild(actionSelect);

    tmpPre.textContent = JSON.stringify(actionData, null, "    ");
    document.querySelector("#behaviorActions").appendChild(tmpPre);
    //document.querySelector("#behaviorEdit pre").textContent = actions;
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
        var sit = behavior.situation.join(", ");
        if (behavior.situation.length === 0) {
            sit = "default";
        }
        bTableRow = document.createElement("option");
        bTableRow.value = index;
        bTableRow.textContent = sit + " : " + behavior.response;
        bTable.appendChild(bTableRow);
    });
}

function move(type) {
    socket.emit('move', type);
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

function setSenseParam(sense, perceiver, val) {
    socket.emit("setsenseParam", sense + "," + perceiver + "," + val);
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
                socket.emit("set" + paramType + "Param", sense + "," + perceiver + "," + val);
                //setSenseParam(perceiver, param, this.value);
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

function displayActionParams(params) {
    displayParams(params, "action");
}

/*function displayActionParams(params) {
    window.console.log(params);
    //actionParams
}*/

function checkLayers() {
    layers.forEach(function (layer) {
        var check = document.getElementById("layer-" + layer);
        document.getElementById(layer).style.display = (check.checked) ? "block" : "none";
    });
}

function init() {
    disableControlButtons(true);
    document.getElementById("newBehavior").onclick = function () {
        document.getElementById("behaviorEdit").showModal();
    };
    document.getElementById("closeBehaviorEdit").onclick = function () {
        document.getElementById("behaviorEdit").close();
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
    //socket.on("moods", displayMoods);
    socket.on("actions", displayActions);
    socket.on("behaviors", displayBehaviors);
    socket.on("getSenseParams", displaySenseParams);
    socket.on("getActionParams", displayActionParams);
    socket.on("disconnect", function () {
        window.console.log('disconnected');
    });
}

init();
