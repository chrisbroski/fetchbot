/*jslint node: true */

function Actions(senses) {
    'use strict';

    // Action performers
    var performer = {},
        // global values
        //Gpio = require('pigpio').Gpio,
        rightEnable = {},
        rightForward = {},
        rightBackward = {},

        leftEnable = {},
        leftForward = {},
        leftBackward = {},

        movement = {};

    function digitalWrite(val) {
        console.log(val);
    }

    rightEnable.digitalWrite = digitalWrite;
    rightForward.digitalWrite = digitalWrite;
    rightBackward.digitalWrite = digitalWrite;
    leftEnable.digitalWrite = digitalWrite;
    leftForward.digitalWrite = digitalWrite;
    leftBackward.digitalWrite = digitalWrite;

    movement.forwardleft = [1, 0, 0, 0];
    movement.forward = [1, 0, 1, 0];
    movement.forwardright = [0, 0, 1, 0];
    movement.rotateleft = [1, 0, 0, 1];
    movement.stop = [0, 0, 0, 0];
    movement.rotateright = [0, 1, 1, 0];
    movement.backleft = [0, 0, 0, 1];
    movement.backward = [0, 1, 0, 1];
    movement.backright = [0, 1, 0, 0];

    function motor(params) {
        rightForward.digitalWrite(params[0]);
        rightBackward.digitalWrite(params[1]);
        leftForward.digitalWrite(params[2]);
        leftBackward.digitalWrite(params[3]);
    }

    performer.setMood = function setMood(mood) {
        senses.setMood(mood);
    };

    function pulseMove(movetype, pulseTime) {
        motor(movement[movetype]);
        setTimeout(function () {
            motor(movement.stop);
            senses.currentAction('', []);
        }, pulseTime);
    }

    performer.move = function move(params) {
        var type = params[0] || 'stop',
            pulseTime = params[1] || 1.0;

        if (pulseTime < 0.99) {
            pulseTime = Math.floor(pulseTime * 1000);
            pulseMove(type, pulseTime);
        } else {
            motor(movement[type]);
        }
        if (type === 'stop') {
            senses.currentAction('', []);
        } else {
            senses.currentAction('move', [type, pulseTime]);
        }
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
        },
        {
            description: 'pulseTime',
            values: [
                0.0,
                1.0
            ],
            default: 1.0
        }
    ];

    performer.search = function () {
        // spin around and look for the ball
        // If you don't see it in 360 degrees, pick a direction and move a short distance
        // repeat
        console.log('searching...');
    };

    performer.backupAndChange = function () {
        // If an obstacle was encountered, back up and try a different direction
        console.log('backing up...');
    };

    this.dispatch = function actionDispatch(type, params) {
        var actions = [];

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
        motor([0, 0, 0, 0]);
    }

    init();
}

module.exports = Actions;
