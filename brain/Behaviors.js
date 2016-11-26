/*jslint node: true, bitwise: true */

var behaviorTable = require("./behavior/behaviorTable.json");

function Behaviors(senses, actions, config) {
    'use strict';

    var situations = {}, responses = {}, stateHash;

    function sum(arr) {
        return arr.reduce(function (a, b) {
            return a + b;
        });
    }

    // Situations should only return a boolean indicating if the situation was recognized
    situations.targetDirection = function (state) {
        if (sum(state.perceptions.targetDirection) > 0) {
            return false;
        }
        return true;
    };

    situations.noTarget = function (state) {
        if (sum(state.perceptions.targetDirection) === 0) {
            return true;
        }
        return false;
    };

    situations.default = function () {
        return true;
    };

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

    responses.search = function () {
        return ["move", {"type": "stop"}];
    };

    responses.stop = function () {
        return ["move", {"type": "stop"}];
    };

    this.behaviorTable = function () {
        return JSON.parse(JSON.stringify(behaviorTable));
    };

    function behavior(state) {
        var ii, len = behaviorTable.length;//, actionParams;

        // Skip if under manual control
        if (config.manual) {
            return false;
        }

        for (ii = 0; ii < len; ii += 1) {
            if (situations[behaviorTable[ii].situation](state)) {
                actions.dispatch(responses[behaviorTable[ii].action](state));
                return true;
            }
        }

        return false;
    }

    /* From http://stackoverflow.com/questions/7616461#answer-7616484 */
    function hashCode(s) {
        var hash = 0, i, chr, len = s.length;
        if (len === 0) {
            return hash;
        }
        for (i = 0; i < len; i += 1) {
            chr = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    function monitor() {
        var state = senses.senseState(),
            currentStateHash = hashCode(JSON.stringify(state));

        if (currentStateHash !== stateHash) {
            stateHash = currentStateHash;
            behavior(state);
        }
    }

    function init() {
        setInterval(monitor, 200);
    }

    init();
}

module.exports = Behaviors;
