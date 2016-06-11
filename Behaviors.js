/*jslint node: true, bitwise: true */

function Behaviors(senses, actions) {
    'use strict';

    var behaviorTable, situations = {}, stateHash;

    function hasMood(mood, moodType) {
        if (moodType) {
            return true;
        }
        return false;
    }

    situations.noMood = function (state) {
        return !hasMood(state.mood, '');
    };

    behaviorTable = [
        {situation: ['noMood'], actions: ['setMood', 'searching']}
    ];

    function behavior(state) {
        var ii, len = behaviorTable.length;

        for (ii = 0; ii < len; ii += 1) {
            actionParams = situations[behaviorTable[ii].situation[0]](state);
            if (actionParams) {
                actions.dispatch(behaviorTable[ii].actions, actionParams);
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

        }
    }

    function init() {
        setTimeout(monitor, 50);
    }

    init();
}

module.exports = Behaviors;
