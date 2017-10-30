/*jslint node: true, bitwise: true */

var behaviorTable = require("./behavior/behaviorTable.json");

function Behaviors(senses, actions, config) {
    'use strict';

    var currentBehavior;

    function detectorMatch(situation, detector) {
        var ii, keys = Object.keys(situation), len = keys.length;

        if (len === 0) {
            return false;
        }

        for (ii = 0; ii < len; ii += 1) {
            if (detector[keys[ii]] !== situation[keys[ii]]) {
                return false;
            }
        }
        return true;
    }

    /*responses.chase = function (state) {
        var dir = state.perceptions.targetDirection;

        if (sum(dir) === 0) {
            return ["move", {"type": "stop"}];
        }

        if (dir[0] > dir[1] && dir[0] > dir[2]) {
            return ["move", {"type": "rotateright", "speed": 0.02}];
        }
        if (dir[2] > dir[0] && dir[2] > dir[1]) {
            return ["move", {"type": "rotateleft", "speed": 0.02}];
        }
        return ["move", {"type": "forward"}];
    };

    responses.stop = function () {
        return ["move", {"type": "stop"}];
    };*/

    /*this.behaviorTable = function () {
        return JSON.parse(JSON.stringify(global.behaviorTable));
    };*/

    function respond() {
        var selectedBehavior;

        // Skip if under manual control
        // This should be handled by the Actions module so we still set current action state
        if (config.manual) {
            return false;
        }

        selectedBehavior = global.behaviorTable.find(function (behavior) {
            return (detectorMatch(behavior.situation, senses.senseState().detectors));
        });

        if (currentBehavior !== JSON.stringify(selectedBehavior) && (!selectedBehavior || !selectedBehavior.response)) {
            currentBehavior = JSON.stringify(selectedBehavior);
            console.log("No response found for situation:");
            console.log(senses.senseState().detectors);
            return;
        }
        currentBehavior = JSON.stringify(selectedBehavior);

        // params are optional
        if (selectedBehavior.response.length < 3) {
            selectedBehavior.response.push([]);
        }

        /*if (!selectedBehavior) {
            response = global.behaviorTable[0].response;
        } else {
            response = selectedBehavior.response;
        }*/
        actions.dispatch(selectedBehavior.response[0], selectedBehavior.response[1], selectedBehavior.response[2]);
    }

    /*function monitor() {
        var state = senses.senseState();
        respond(state);
    }*/

    this.updateBTable = function updateBTable(newBTable) {
        global.behaviorTable = newBTable;
    };

    function init() {
        global.behaviorTable = behaviorTable;
        setInterval(respond, 200);
    }

    init();
}

module.exports = Behaviors;
