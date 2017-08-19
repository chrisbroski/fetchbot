/*jslint node: true, bitwise: true */

var behaviorTable = require("./behavior/behaviorTable.json");

function Behaviors(senses, actions, config) {
    'use strict';

    var responses = {};

    function sum(arr) {
        return arr.reduce(function (a, b) {
            return a + b;
        });
    }

    function trueDetectors() {
        var detectors = senses.senseState().detectors;

        return Object.keys(detectors).filter(function (detector) {
            if (detectors[detector]) {
                return detector;
            }
        });
    }

    function detectorMatch(a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }

        return (a.join(",") === b.join(","));
    }

    responses.chase = function (state) {
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
    };

    this.behaviorTable = function () {
        return JSON.parse(JSON.stringify(behaviorTable));
    };

    function respond(state) {
        var response, selectedBehavior, situationEnv = trueDetectors();

        // Skip if under manual control
        // This should be handled by the Actions module so we still set current action state
        if (config.manual) {
            return false;
        }

        selectedBehavior = behaviorTable.find(function (behavior) {
            return (detectorMatch(behavior.situation, situationEnv));
        });

        if (!selectedBehavior) {
            response = behaviorTable[0].response;
        } else {
            response = selectedBehavior.response;
        }
        actions.dispatch(responses[response](state));
    }

    function monitor() {
        var state = senses.senseState();
        respond(state);
    }

    function init() {
        setInterval(monitor, 200);
    }

    init();
}

module.exports = Behaviors;
