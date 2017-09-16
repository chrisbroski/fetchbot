/*jslint node: true */

function Actions(senses, virtual) {
    'use strict';

    // Action performers
    var DcWheels = require('./action/DcWheels.js'),
        dcwheels = new DcWheels(senses, virtual),
        perform = {},
        maneuver = {};

    perform.setMood = function setMood(params) {
        if (!params) {
            return [
                {
                    description: 'type',
                    options: [
                        'searching',
                        'relaxing',
                        'sleepy'
                    ],
                    auto: 'searching'
                },
                {
                    description: 'duration',
                    val: [
                        0,
                        86400
                    ],
                    auto: 60
                }
            ];
        }
        senses.setMood(params.type);
    };

    // Set up performers and ameuvers from libraries
    perform.move = dcwheels.perform.move;
    maneuver.chase = dcwheels.maneuver.chase;
    maneuver.search = dcwheels.maneuver.search;

    this.dispatch = function actionDispatch(type, name, params) {
        params = params || {};

        var actions = {},
            currentAction,
            newAction;

        // if no action is given, return a list of available types and parameters
        if (!type) {
            actions.perform = {};
            actions.maneuver = {};
            Object.keys(perform).forEach(function (act) {
                actions.perform[act] = perform[act]();
            });

            Object.keys(maneuver).forEach(function (act) {
                actions.maneuver[act] = act;
            });

            return JSON.parse(JSON.stringify(actions));
        }

        currentAction = JSON.stringify(senses.senseState().currentAction);
        newAction = JSON.stringify([type, name, params]);
        if (currentAction !== newAction) { // if not current action
            senses.currentAction(type, name, params);
            console.log(type, name, params);
        }
        if (!virtual) {
        //    console.log('virtual:', type, params);
        //} else {
            this[type][name](params);
        }
    };
}

module.exports = Actions;
