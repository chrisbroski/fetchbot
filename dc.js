/*
Test drive a DC motor
*/

var gpio = require('pigpio').Gpio,
    rightEnable = new gpio(17, {mode: gpio.OUTPUT}),
    rightForward = new gpio(22, {mode: gpio.OUTPUT}),
    rightBackward = new gpio(27, {mode: gpio.OUTPUT}),

    leftEnable = new gpio(5, {mode: gpio.OUTPUT}),
    leftForward = new gpio(13, {mode: gpio.OUTPUT}),
    leftBackward = new gpio(6, {mode: gpio.OUTPUT});

rightEnable.digitalWrite(1);
leftEnable.digitalWrite(1);

rightForward.digitalWrite(1);
rightBackward.digitalWrite(0);

leftForward.digitalWrite(1);
leftBackward.digitalWrite(0);

function stop() {
    rightEnable.digitalWrite(0);
    leftEnable.digitalWrite(0);
}

setTimeout(function () {
    rightForward.digitalWrite(0);
    rightBackward.digitalWrite(0);
}, 2000);

setTimeout(function () {
    rightForward.digitalWrite(1);
    rightBackward.digitalWrite(0);
}, 3000);

setTimeout(stop, 5000);
