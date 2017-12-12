/*jslint node: true */

global.params.actions = {};
global.params.actions.turn = {};
global.params.actions.turn.speed = 0.02;
global.params.actions.search = {};
global.params.actions.search.maxDuration = 2000;

function DcWheels(senses, virtual) {
    'use strict';

    var Gpio,
        rightForward,
        rightBackward,
        leftForward,
        leftBackward,
        performParams = {},
        movement = {},
        pulseTimer,
        searchTimer = 0,
        searchMoveType;

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

    this.perform.move = function move(params, search) {
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
    };

    this.maneuver.chase = function () {
        var dir = senses.senseState().perceptions.targetDirection;

        if (sum(dir) === 0) {
            return ["move", {"type": "stop"}];
        }

        if (dir[0] > dir[1] && dir[0] > dir[2]) {
            return ["move", {"type": "rotateright", "speed": global.params.actions.turn.speed}];
        }
        if (dir[2] > dir[0] && dir[2] > dir[1]) {
            return ["move", {"type": "rotateleft", "speed": global.params.actions.turn.speed}];
        }
        return ["move", {"type": "forward"}];
    };

    function resetTimer() {
        searchTimer = +(new Date()) + (Math.random() * global.params.actions.search.maxDuration);
    }

    this.maneuver.search = function () {
        if (!searchTimer) {
            resetTimer();
            searchMoveType = "forward";
        } else {
            if (+(new Date()) > searchTimer) {
                resetTimer()
                if (searchMoveType === "forward") {
                    searchMoveType = (Math.random() > 0.5) ? "rotate-right" : "rotate-left";
                } else if (searchMoveType === "rotate-right" || searchMoveType === "rotate-left") {
                    searchMoveType = "stop";
                } else {
                    searchMoveType = "forward";
                }
            }
        }

        return ["move", {"type": searchMoveType}];
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
