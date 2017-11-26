/*jslint node: true, bitwise: true */

var behaviorTable = require("./behavior/behaviorTable.json");

function Behaviors(senses, actions, config) {
    'use strict';

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

    function respond() {
        var selectedBehavior, response;

        // Skip if under manual control
        // This should be handled by the Actions module so we still set current action state
        if (config.manual) {
            return false;
        }

        selectedBehavior = global.behaviorTable.find(function (behavior) {
            return (detectorMatch(behavior.situation, senses.senseState().detectors));
        });
        if (!selectedBehavior) {
            // Let's assume the first behavior is the default
            selectedBehavior = global.behaviorTable[0];
        }
        response = selectedBehavior.response;

        // Maneuvers don't require an act
        if (response.length === 1) {
            response.push("");
        }
        // params are optional
        if (response.length === 2) {
            response.push({});
        }

        actions.dispatch(response[0], response[1], response[2]);
    }

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
