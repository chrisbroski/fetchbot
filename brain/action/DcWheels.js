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
        movement = {},
        pulseTimer;

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

    function pulseMove(movetype, pulseTime, isOn) {
        if (isOn) {
            motor(movement[movetype]);
        } else {
            motor(movement.stop);
        }
        pulseTimer = setTimeout(function () {
            pulseMove(movetype, 1000 - pulseTime, !isOn);
        }, pulseTime);
    }

    function sum(arr) {
        return arr.reduce(function (a, b) {
            return a + b;
        });
    }

    performParams.move = [
        {
            description: "type",
            values: [
                "forward-left",
                "forward",
                "forward-right",
                "rotate-left",
                "stop",
                "rotate-right",
                "back-left",
                "backward",
                "back-right"
            ],
            auto: "stop"
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
        var pulseTime;

        if (!params) {
            return performParams.move;
        }

        pulseTime = params.speed || 1.0;

        clearTimeout(pulseTimer);
        if (pulseTime < 0.99) {
            pulseTime = Math.floor(pulseTime * 1000);
            pulseMove(params.type.replace(/-/, ""), pulseTime, true);
        } else {
            motor(movement[params.type.replace(/-/, "")]);
        }
        senses.currentAction('perform', 'move', params);
    };

    // Export manuevers to their own module in a future version
    this.maneuver.chase = function () {
        // get sense state and do maneuver
        var dir = senses.senseState().perceptions.targetDirection;

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
