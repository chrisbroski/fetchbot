/*jslint node: true */

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

function turnHalfSpeed(delay, pulse) {
    setTimeout(function () {
        var moveType = 'stop';
        if (pulse) {
            moveType = 'forwardright';
        }
        motor(movement[moveType]);
        setTimeout(function () {
            turnHalfSpeed(delay, !pulse);
        }, delay);
    }, delay);
}

turnHalfSpeed(125, true);
