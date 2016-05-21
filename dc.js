/*
Test PWM driver on a DC motor
*/
var gpio = require('pigpio').Gpio,
    motor = new gpio(19, {mode: gpio.OUTPUT}),
    led = new gpio(17, {mode: gpio.OUTPUT}),
    pulseWidth = 1000,
    increment = 100;

led.digitalWrite(1);
motor.servoWrite(pulseWidth);

setTimeout(function () {
    led.digitalWrite(0);
}, 3000);
