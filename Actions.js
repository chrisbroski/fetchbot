/*jslint node: true */

function Actions(senses) {
    'use strict';

    // Action performers
    var performer = {},
        // global values
        Gpio = require('pigpio').Gpio,
        rightEnable = new Gpio(17, {mode: Gpio.OUTPUT}),
        rightForward = new Gpio(22, {mode: Gpio.OUTPUT}),
        rightBackward = new Gpio(27, {mode: Gpio.OUTPUT}),

        leftEnable = new Gpio(5, {mode: Gpio.OUTPUT}),
        leftForward = new Gpio(13, {mode: Gpio.OUTPUT}),
        leftBackward = new Gpio(6, {mode: Gpio.OUTPUT}),
        randRotation = Math.random() * 4500,
        randDirection = Math.floor(Math.random() * 2),

        movement = {};

    movement.forwardleft = [1, 0, 0, 0];
    movement.forward = [1, 0, 1, 0];
    movement.forwardright = [0, 0, 1, 0];
    movement.rotateleft = [1, 0, 0, 1];
    movement.stop = [0, 0, 0, 0];
    movement.rotateright = [0, 1, 1, 0];
    movement.backleft = [0, 0, 0, 1];
    movement.backward = [0, 1, 0, 1];
    movement.backright = [0, 1, 0, 0];

    function travel(moveType) {
        var moveParams = movement[moveType];

        rightForward.digitalWrite(moveParams[0]);
        rightBackward.digitalWrite(moveParams[1]);
        leftForward.digitalWrite(moveParams[2]);
        leftBackward.digitalWrite(moveParams[3]);
    }

    performer.move = function move(params) {
        var type = params || 'stop';
        console.log('move', type);

        // take action
        //senses.currentAction('move', id, params);
        //if (type === 'forward') {
            travel(type);
        //} else {
        //    stop();
        //}
    };

    performer.move.params = [
        {
            description: 'type',
            values: [
                'forward',
                'forward-right',
                'rotate-right',
                'back-right',
                'backward',
                'back-left',
                'rotate-left',
                'forward-left'
            ],
            default: 'stop'
        }
    ];

    this.dispatch = function actionDispatch(type, params) {
        //var currentAction = senses.senseState().currentAction, actions = [];

        // if no type is given, return a list of available types and parameters
        if (!type) {
            Object.keys(performer).forEach(function (act) {
                actions.push({
                    action: act,
                    parameters: performer[act].params
                });
            });

            return JSON.stringify(actions, null, '    ');
        }

        if (type === 'move') {
            performer.move(params);
        }
    };

    function init() {
        rightEnable.digitalWrite(1);
        leftEnable.digitalWrite(1);
        travel('stop');
    }

    init();
}

module.exports = Actions;
