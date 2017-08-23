/*jslint browser: true, sloppy: true */
/*global io */

var socket, canvasEdge, ctxEdge, canvasBall, ctxBall, viewWidth, mag, halfMag, width, stateHash = 0, control = 'auto', manualOverrideTimer, canvasLuma, ctxLuma, canvasChromaU, ctxChromaU, canvasChromaV, ctxChromaV, layers;

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
    if (action && action.type) {
        return action.type + ': ' + action.parameters.join(", ");
    }
    return "none";
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

function senseStateReceived(senseState) {
    var jsonState = JSON.parse(senseState),
        jsonString,
        currentAction;

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
    console.log(actions);
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

function setSenseParam(senselib, sense, perceiver, val) {
    socket.emit("setSenseParam", senselib + "," + sense + "," + perceiver + "," + val);
}

function displaySenseParams(params) {
    var senseParamDiv = document.getElementById("senseParams");
    params = JSON.parse(params);

    Object.keys(params).forEach(function (key) {
        var fieldset = document.createElement("fieldset"),
            legend = document.createElement("legend");
        legend.textContent = key;
        fieldset.appendChild(legend);

        Object.keys(params[key]).forEach(function (perceiver) {
            var h4 = document.createElement("h4");
            h4.textContent = perceiver;
            fieldset.appendChild(h4);
            console.log(perceiver);

            Object.keys(params[key][perceiver]).forEach(function (param) {
                var label = document.createElement("label"),
                    input = document.createElement("input"),
                    button = document.createElement("button");

                label.textContent = param;
                input.type = "number";
                input.value = params[key][perceiver][param];
                input.onchange = function () {
                    setSenseParam(key, perceiver, param, this.value);
                };

                button.type = "button";
                button.textContent = "Update";

                label.appendChild(input);
                label.appendChild(button);
                fieldset.appendChild(label);
            });
        });
        senseParamDiv.appendChild(fieldset);
    });
}

function checkLayers() {
    layers.forEach(function (layer) {
        var check = document.getElementById("layer-" + layer);
        document.getElementById(layer).style.display = (check.checked) ? "block" : "none";
    });
}

function init() {
    disableControlButtons(true);

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
    socket.on("disconnect", function () {
        console.log('disconnected');
    });
}

init();
