/*jslint browser: true, sloppy: true */
/*global io */

var socket, control = 'auto', detectors, actionData, editingBehavior, viz = {};

viz.dimensions = {};
viz.canvasWidth = 400;
viz.canvasHeight = 300;

viz.layers = {};
viz.layers.luma = {type: "raw"};
viz.layers.luma.color = function (val) {
    return "rgba(" + val + ", " + val + ", " + val + ", 0.5)";
};
viz.layers.chromaU = {type: "raw", downsample: 2};
viz.layers.chromaU.color = function (val) {
    return "rgba(0, 0, 255, " + (val / 512) + ")";
};
viz.layers.chromaV = {type: "raw", downsample: 2};
viz.layers.chromaV.color = function (val) {
    return "rgba(255, 0, 0, " + (val / 512) + ")";
};
viz.layers.edges = {color: [0, 0, 0, 0.8]};
viz.layers.brightRed = {color: [255, 0, 0, 0.5], downsample: 2};

function disableControlButtons(disOrEnable) {
    var buttons = document.querySelectorAll('#controls button, #actions button'), ii, len;
    len = buttons.length;
    for (ii = 0; ii < len; ii += 1) {
        buttons[ii].disabled = disOrEnable;
    }
}

function setControl(autoOrManual) {
    var controlButton = document.querySelector("#manual button");

    control = autoOrManual;
    if (control === "manual") {
        document.querySelector('#manual button').innerHTML = "Relinquish control";
        disableControlButtons(false);
        document.getElementById("display-action-type").textContent = "manual";
    } else {
        document.querySelector("#manual button").innerHTML = "Request manual control";
        document.getElementById("display-action-type").textContent = "";
        disableControlButtons(true);
    }

    controlButton.disabled = false;
    //disableControlButtons(disOrEnabled);
}

function describeAction(action) {
    var actionType = document.getElementById("display-action-type"),
        actionDetail = document.getElementById("current-action");

    if (action[0] === "maneuver") {
        actionType.textContent = action[0] + ": " + action[1];
        actionDetail.textContent = action[2][0] + ": " + JSON.stringify(action[2][1]);
    } else {
        actionType.textContent = action[0];
        actionDetail.textContent = action[1] + " " + JSON.stringify(action[2]);
    }
}

function paintRaw(v, dots) {
    var ctx = viz.layers[v].ctx,
        downsample = viz.layers[v].downsample || 1,
        mag = downsample * viz.canvasWidth / viz.width,
        width =  viz.width / downsample;

    ctx.clearRect(0, 0, viz.canvasWidth, viz.canvasHeight);
    dots.forEach(function (dot, index) {
        var x = (index % width) * mag,
            y = (Math.floor(index / width)) * mag;

        ctx.fillStyle = viz.layers[v].color(dot);
        ctx.beginPath();
        ctx.fillRect(x, y, mag, mag);
        ctx.closePath();
        ctx.fill();
    });
}

var frameId = 0;
function displayLive(raw) {
    frameId += 10;
    var lumaArray = [], len = raw.length, ii, ctx, mag;
    for (ii = 0; ii < len; ii += 1) {
        lumaArray.push(raw.charCodeAt(ii));
    }
    socket.emit("rawTimer", frameId);

    ctx = viz.layers.luma.ctx;
    mag = viz.canvasWidth / viz.width;

    ctx.clearRect(0, 0, viz.canvasWidth, viz.canvasHeight);
    lumaArray.forEach(function (dot, index) {
        var x = (index % viz.width) * mag,
            y = (Math.floor(index / viz.width)) * mag;

        ctx.fillStyle = viz.layers.luma.color(dot);
        ctx.beginPath();
        ctx.fillRect(x, y, mag, mag);
        ctx.closePath();
        ctx.fill();
    });
}

function displayRaw(raw) {
    frameId += 10;
    raw = JSON.parse(raw);
    socket.emit("rawTimer", frameId);
    paintRaw("luma", raw);
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

function paintViz(v, dots) {
    var ctx = viz.layers[v].ctx,
        downsample = viz.layers[v].downsample || 1,
        mag = downsample * viz.canvasWidth / viz.width,
        width =  viz.width / downsample;

    ctx.clearRect(0, 0, viz.canvasWidth, viz.canvasHeight);

    dots.forEach(function (dot) {
        var x = (dot % width) * mag,
            y = (Math.floor(dot / width)) * mag;

        ctx.beginPath();
        ctx.fillRect(x, y, mag, mag);
        ctx.closePath();
        ctx.fill();
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

    currentAction = jsonState.currentAction;
    describeAction(currentAction);
    delete jsonState.currentAction;
    jsonString = JSON.stringify(jsonState, null, '    ');

    document.querySelector('#senseState').innerHTML = jsonString;

    // Paint visuaslisations
    Object.keys(viz.layers).forEach(function (v) {
        if (viz.layers[v].type !== "raw") {
            paintViz(v, jsonState.perceptions[v]);
        }
    });
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
        paramLabel.setAttribute("data-action-param", param.description);
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
        actName = this.textContent,
        paramData = {};

    Array.from(paramSelects).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = inp.value;
    });
    Array.from(paramInputs).forEach(function (inp) {
        paramData[inp.getAttribute("data-action-param")] = +inp.value;
    });
    if (this.getAttribute("data-action")) {
        paramData[this.getAttribute("data-action-param")] = actName;
        actName = this.getAttribute("data-action");
    }

    socket.emit("action", JSON.stringify([actType, actName, paramData]));
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

    var detector = data.slice(0, data.indexOf(" ")),
        response = JSON.parse(data.slice(data.indexOf(" ")));

    if (detector !== "default:") {
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

function behaviorDisplay(behavior) {
    var detectTrue = [], detectFalse = [], sit;

    Object.keys(behavior.situation).forEach(function (d) {
        if (behavior.situation[d]) {
            detectTrue.push(d);
        } else {
            detectFalse.push(d);
        }
    });
    if (detectTrue.length === 0 && detectFalse.length === 0) {
        sit = "default ";
    } else {
        if (detectTrue.length > 0) {
            sit = detectTrue.join(", ") + " ";
        }
        if (detectFalse.length > 0) {
            sit = sit + "(" + detectFalse.join(", ") + ") ";
        }
    }

    if (behavior.response[0] === "perform") {
        return sit + "→ " + behavior.response[1] + ": " + JSON.stringify(behavior.response[2]);
    }
    return sit + "→ maneuver: " + behavior.response[0];
}

function editBehavior() {
    editingBehavior = this.value;
    populateBehavior(this.textContent);
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
        bTableRow = document.createElement("option");
        bTableRow.value = index;
        bTableRow.textContent = behaviorDisplay(behavior);
        bTableRow.ondblclick = editBehavior;
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
    var paramDiv = document.getElementById(paramType + "Params"),
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
            if (Math.round(params[perceiver][param]) !== params[perceiver][param]) {
                input.setAttribute("step", "0.01");
            }
            input.onchange = function () {
                socket.emit("set" + paramType + "Param", perceiver + "," + param + "," + this.value);
            };

            button.type = "button";
            button.textContent = "Update";

            label.appendChild(input);
            label.appendChild(button);
            fieldset.appendChild(label);
        });

        paramDiv.appendChild(fieldset);
    });
}

function checkLayers() {
    Object.keys(viz.layers).forEach(function (layer) {
        var check = document.getElementById("layer-" + layer);
        document.getElementById(layer).style.display = (check.checked) ? "block" : "none";
    });
}

function getBehaviorTable() {
    var behaviorData = [],
        bTable = document.getElementById('behaviorTable');

    Array.from(bTable.options).forEach(function (b) {
        var strSit = b.textContent.slice(0, b.textContent.indexOf(":")).trim(),
            strRsp = b.textContent.slice(b.textContent.indexOf(":") + 1).trim(),
            bData = {},
            trueSit,
            falseSit = [],
            situation = {};

        // situation
        if (strSit !== "default") {
            if (strSit.indexOf("(") > -1) {
                falseSit = strSit.slice(strSit.indexOf("(") + 1, -1).split(", ");
                trueSit = strSit.slice(0, strSit.indexOf(" (")).split(", ");
            } else {
                trueSit = strSit.split(", ");
            }
            trueSit.forEach(function (d) {
                situation[d] = true;
            });
            falseSit.forEach(function (d) {
                situation[d] = false;
            });
        }
        bData.situation = situation;
        bData.response = JSON.parse(strRsp);
        behaviorData.push(bData);
    });
    return JSON.stringify(behaviorData);
}

function createBehaviorData() {
    // go through dialog and build the behavior
    var situations = document.querySelectorAll("#behaviorEdit > div:first-child > div"),
        situation = {},
        actionSelect = document.getElementById("action-type"),
        actionParams,
        actionParam = {},
        response = [];

    Array.from(situations).forEach(function (s) {
        var radios = Array.from(s.getElementsByTagName("input")),
            detector = s.getAttribute("data-detector");

        radios.forEach(function (r) {
            if (r.checked && r.value !== "") {
                situation[detector] = !!+r.value;
            }
        });
    });

    response.push(actionSelect.value.slice(0, actionSelect.value.indexOf("-")));
    response.push(actionSelect.value.slice(actionSelect.value.indexOf("-") + 1));
    actionParams = Array.from(document.querySelectorAll("#action-param > label"));
    actionParams.forEach(function (ap) {
        var paramValue = ap.getElementsByTagName("select");
        if (paramValue.length === 0) {
            paramValue = ap.getElementsByTagName("input");
        }
        actionParam[ap.getAttribute("data-action-param")] = paramValue[0].value;
    });
    if (actionParams.length) {
        response.push(actionParam);
    }
    return {"situation": situation, "response": response};
}

function init() {
    disableControlButtons(true);
    document.getElementById("newBehavior").onclick = function () {
        clearDetectors();
        editingBehavior = -1;
        document.getElementById("behaviorEdit").showModal();
    };
    document.getElementById("closeBehaviorEdit").onclick = function () {
        document.getElementById("behaviorEdit").close();
    };
    document.getElementById("saveBehavior").onclick = function () {
        socket.emit('btable', getBehaviorTable());
    };
    document.getElementById("saveBehaviorEdit").onclick = function () {
        var bTable = document.getElementById("behaviorTable"),
            option = document.createElement("option");

        if (editingBehavior === -1) {
            // add to list
            option.value = bTable.options.length;
            option.textContent = behaviorDisplay(createBehaviorData());
            option.ondblclick = editBehavior;
            bTable.appendChild(option);
        } else {
            // update list
            window.console.log(editingBehavior);
            bTable.options[editingBehavior].textContent = behaviorDisplay(createBehaviorData());
        }
    };

    socket = io({reconnection: false});
    socket.on("width", function (data) {
        viz.width = +data;
    });

    // Create canvas visualisation layers
    var vizualizer = document.getElementById('vizualize');
    Object.keys(viz.layers).forEach(function (v) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext("2d");

        canvas.id = v;
        canvas.width = viz.canvasWidth;
        canvas.height = viz.canvasHeight;
        viz.layers[v].canvas = canvas;
        vizualizer.appendChild(canvas);

        if (viz.layers[v].color && typeof viz.layers[v].color !== "function") {
            ctx.fillStyle = "rgba(" + viz.layers[v].color.join(", ") + ")";
        }
        viz.layers[v].ctx = ctx;
    });

    Object.keys(viz.layers).forEach(function (layer) {
        document.getElementById("layer-" + layer).onclick = checkLayers;
    });
    checkLayers();

    socket.on("senseState", senseStateReceived);
    socket.on("senseRaw", displayLive);
    // socket.on("senseRaw", displayRaw);
    socket.on("actions", displayActions);
    socket.on("behaviors", displayBehaviors);
    socket.on("getSenseParams", function (p) {
        displayParams(p, "sense");
    });
    socket.on("getActionParams", function (p) {
        displayParams(p, "action");
    });
    socket.on("disconnect", function () {
        window.console.log('disconnected');
    });
}

init();
