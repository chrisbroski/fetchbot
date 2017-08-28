/*jslint node: true */

function Actions(senses, virtual) {
    'use strict';

    // Action performers
    var DcWheels = require('./action/DcWheels.js'),
        dcwheels = new DcWheels(senses, virtual),
        perform = {},
        maneuver = {};

    perform.setMood = function setMood(mood) {
        if (!mood) {
            return [
                {
                    description: 'type',
                    values: [
                        'searching',
                        'stuck',
                        'relaxing',
                        'sleepy'
                    ],
                    default: 'searching'
                },
                {
                    description: 'duration',
                    value: [
                        0,
                        86400
                    ],
                    default: 60
                }
            ];
        }
        senses.setMood(mood);
    };

    // Set up performers and ameuvers from libraries
    perform.move = dcwheels.perform.move;
    maneuver.chase = dcwheels.maneuver.chase;

    this.dispatch = function actionDispatch(actionData) {
        actionData = actionData || [];
        var type = actionData[0] || '',
            params = actionData[1] || {},
            actions = {},
            currentAction,
            newAction;

        // if no action is given, return a list of available types and parameters
        if (!type) {
            actions.perform = [];
            actions.maneuver = [];
            Object.keys(perform).forEach(function (act) {
                var p = {};
                p[act] = perform[act]();
                actions.perform.push(p);
            });

            Object.keys(maneuver).forEach(function (act) {
                var m = {};
                m[act] = maneuver[act]();
                actions.maneuver.push(m);
            });

            return JSON.parse(JSON.stringify(actions));
        }

        currentAction = JSON.stringify(senses.senseState().currentAction);
        newAction = JSON.stringify({"type": type, "parameters": params});
        if (currentAction !== newAction) { // if not current action
            //console.log(senses.senseState().currentAction);
            //console.log({"type": type, parameters: params.parameters});
            console.log({"type": type, "parameters": params});
            senses.currentAction(type, params);
            //console.log(senses.senseState().currentAction);
        }
        if (!virtual) {
        //    console.log('virtual:', type, params);
        //} else {
            performer[type](params);
        }
    };
}

module.exports = Actions;
