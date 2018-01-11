// Test GPIO output

var Gpio = require('pigpio').Gpio,
    red = new Gpio(5, {mode: Gpio.OUTPUT});

function test() {
    red.digitalWrite(1);

    setTimeout(function () {
        red.digitalWrite(0);
    }, 2000);
}

test();
