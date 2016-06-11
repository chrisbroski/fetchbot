/*
Test PWM driver on a servo in preparation for DC motor control
*/
var Gpio = require('pigpio').Gpio,
    motor = new Gpio(19, {mode: Gpio.OUTPUT}),
    pulseWidth = 1000,
    increment = 100;

setInterval(function () {
    motor.servoWrite(pulseWidth);

    pulseWidth += increment;
    if (pulseWidth >= 2000) {
        increment = -100;
    } else if (pulseWidth <= 1000) {
        increment = 100;
    }
}, 1000);
