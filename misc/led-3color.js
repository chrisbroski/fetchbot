// Test 3-color LED

var Gpio = require('pigpio').Gpio,
    red = new Gpio(5, {mode: Gpio.OUTPUT}),
    green = new Gpio(6, {mode: Gpio.OUTPUT}),
    blue = new Gpio(13, {mode: Gpio.OUTPUT});


function test() {
    red.digitalWrite(1);
    green.digitalWrite(0);
    blue.digitalWrite(0);

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
