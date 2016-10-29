/*jslint node: true, bitwise: true */

function Behaviors(senses, actions, config) {
    'use strict';

    var behaviorTable, situations = {}, stateHash;

    function sum(arr) {
        return arr.reduce(function (a, b) {
            return a + b;
        });
    }

    situations.targetDirection = function (state) {
        var dir = state.perceptions.targetDirection;

        if (sum(dir) === 0) {
            return false;
        }

        if (dir[0] > dir[1] && dir[0] > dir[2]) {
            return ['rotateright', 0.02];
        }
        if (dir[2] > dir[0] && dir[2] > dir[1]) {
            return ['rotateleft', 0.02];
        }
        return ['forward'];
    };

    situations.default = function () {
        return ['stop'];
    };

    behaviorTable = [
        {situation: 'targetDirection', action: 'move'},
        {situation: 'default', action: 'move'}
    ];

    function behavior(state) {
        var ii, len = behaviorTable.length, actionParams;

        // Don't bother if under manual control
        if (config.manual) {
            return false;
        }

        for (ii = 0; ii < len; ii += 1) {
            actionParams = situations[behaviorTable[ii].situation](state);
            if (actionParams) {
                actions.dispatch(behaviorTable[ii].action, actionParams);
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
