/*
Test PWM driver on a servo in preparation for DC motor control
*/
var Gpio = require('pigpio').Gpio,
    red = new Gpio(20, {mode: Gpio.OUTPUT}),
    green = new Gpio(21, {mode: Gpio.OUTPUT}),
    blue = new Gpio(22, {mode: Gpio.OUTPUT});


function test() {
    red.digitalWrite(1);
    setTimeout(function () {
        red.digitalWrite(0);
        green.digitalWrite(1);
    }, 2000);
    setTimeout(function () {
        green.digitalWrite(0);
        blue.digitalWrite(1);
    }, 4000);
    setTimeout(function () {
        blue.digitalWrite(0);
    }, 6000);
}

test();
