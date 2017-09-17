/*jslint node: true */

global.params.actions = {};
global.params.actions.turn = {};
global.params.actions.turn.speed = 0.02;

function DcWheels(senses, virtual) {
    'use strict';

    var Gpio,
        rightForward,
        rightBackward,
        leftForward,
        leftBackward,
        performParams = {},
        movement = {};

    this.perform = {};
    this.maneuver = {};

    if (!virtual) {
        Gpio = require('pigpio').Gpio;
        rightForward = new Gpio(22, {mode: Gpio.OUTPUT});
        rightBackward = new Gpio(27, {mode: Gpio.OUTPUT});
        leftForward = new Gpio(13, {mode: Gpio.OUTPUT});
        leftBackward = new Gpio(6, {mode: Gpio.OUTPUT});
    }

    movement.forwardleft = [0, 1, 1, 1];
    movement.backward = [1, 0, 1, 0];
    movement.forwardright = [1, 1, 0, 1];
    movement.rotateright = [1, 0, 0, 1];
    movement.stop = [0, 0, 0, 0];
    movement.rotateleft = [0, 1, 1, 0];
    movement.backleft = [1, 1, 1, 0];
    movement.forward = [0, 1, 0, 1];
    movement.backright = [1, 0, 1, 1];

    function motor(params) {
        rightForward.digitalWrite(params[0]);
        rightBackward.digitalWrite(params[1]);
        leftForward.digitalWrite(params[2]);
        leftBackward.digitalWrite(params[3]);
    }

    function pulseMove(movetype, pulseTime) {
        motor(movement[movetype]);
        setTimeout(function () {
            motor(movement.stop);
            //senses.currentAction('', []);
        }, pulseTime);
    }

    performParams.move = [
        {
            description: 'type',
            values: [
                'forward',
                'forward-right',
                'rotate-right',
                'back-right',
                "stop",
                'backward',
                'back-left',
                'rotate-left',
                'forward-left'
            ],
            auto: 'stop'
        },
        {
            description: 'speed',
            val: [
                0.0,
                1.0
            ],
            auto: 1.0
        }
    ];

    this.perform.move = function move(params) {
        var type, pulseTime;

        if (!params) {
            return performParams.move;
        }

        type = params.type || 'stop';
        pulseTime = params.speed || 1.0;

        if (pulseTime < 0.99) {
            pulseTime = Math.floor(pulseTime * 1000);
            pulseMove(params.type.replace(/-/, ""), pulseTime);
        } else {
            motor(movement[params.type.replace(/-/, "")]);
        }
        if (type === 'stop') {
            senses.currentAction('', {});
        } else {
            senses.currentAction('move', [type, pulseTime]);
        }
    };

    this.maneuver.chase = function () {
        // get sense state and do maneuver
        console.log("maneuver.chase");
    };

    this.maneuver.search = function () {
        // spin around and look for the ball
        // If you don't see it in 360 degrees, pick a direction and move a short distance
        // repeat
        console.log("maneuver.search");
    };

    this.maneuver.backupAndChange = function () {
        // If an obstacle was encountered, back up and try a different direction
        console.log("maneuver.backupAndChange");
    };

    function init() {
        if (!virtual) {
            motor([0, 0, 0, 0]);
        }
    }

    init();
}

module.exports = DcWheels;
