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

        movement = {},
        moveTimer;

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

    function travelAtSpeed(params, delay) {
        motor([0, 0, 0, 0]);
        motor(params);
        moveTimer = setTimeout(function () {
            travelAtSpeed(params, Math.floor(1000 - delay));
        }, Math.floor(1000 - delay));
    }

    function travel(moveType, speed) {
        var moveParams = movement[moveType];
        speed = speed || 1.0;

        if (speed === 1.0) {
            motor(moveParams);
        } else {
            // pulse motors
            moveTimer = setTimeout(function () {
                travelAtSpeed(moveParams, Math.floor(1000 - speed * 1000));
            }, Math.floor(1000 - speed * 1000));
        }
    }

    performer.setMood = function setMood(mood) {
        senses.setMood(mood);
    };

    performer.move = function move(params) {
        var type = params || 'stop';

        // take action
        if (moveTimer) {
            clearTimeout(moveTimer);
        }
        travel(type);
        if (type === 'stop') {
            senses.currentAction('', []);
        } else {
            senses.currentAction('move', [type]);
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
            description: 'speed',
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
        travel('stop');
    }

    init();
}

module.exports = Actions;
