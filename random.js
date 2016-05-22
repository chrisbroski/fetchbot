/*
Rotate a random amount, then move forward for 2000ms
*/

var gpio = require('pigpio').Gpio,
    rightEnable = new gpio(17, {mode: gpio.OUTPUT}),
    rightForward = new gpio(22, {mode: gpio.OUTPUT}),
    rightBackward = new gpio(27, {mode: gpio.OUTPUT}),

    leftEnable = new gpio(5, {mode: gpio.OUTPUT}),
    leftForward = new gpio(13, {mode: gpio.OUTPUT}),
    leftBackward = new gpio(6, {mode: gpio.OUTPUT}),
    randRotation = Math.random() * 4500,
    randDirection = Math.floor(Math.random() * 2);

function stop() {
    rightForward.digitalWrite(0);
    rightBackward.digitalWrite(0);
    leftForward.digitalWrite(0);
    leftBackward.digitalWrite(0);
}

function init() {
    rightEnable.digitalWrite(1);
    leftEnable.digitalWrite(1);

    stop();
}

function rotate(rightOrLeft) {
    var val = Number(rightOrLeft),
        antiVal = Number(!val);

    rightForward.digitalWrite(antiVal);
    rightBackward.digitalWrite(val);
    leftForward.digitalWrite(val);
    leftBackward.digitalWrite(antiVal);
}

function move(forwardOrBack) {
    var val = Number(forwardOrBack),
        antiVal = Number(!val);

    rightForward.digitalWrite(val);
    rightBackward.digitalWrite(antiVal);
    leftForward.digitalWrite(val);
    leftBackward.digitalWrite(antiVal);
}

function main() {
    init();

    rotate(randDirection);

    setTimeout(function () {
        move(1);
    }, randRotation);

    setTimeout(stop, randRotation + 2000);
}

main();
