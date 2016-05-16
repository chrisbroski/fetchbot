# fetchbot

Fetchbot is a robotics project with the end goal of creating a roving bot that can chase, pick up, and return a ball.

## Fetchbot Alpha

The first version only has the intermediate goal of chasing a ball so no grabbing mechanism is needed.

### Hardware

* [Actobotics ActoBitty 2](https://www.sparkfun.com/products/13047) chassis, wheels, 2 DC motors, and 4 AA battery pack.
* [Raspberry Pi 2](https://www.raspberrypi.org/products/raspberry-pi-2-model-b/)
* [Raspberry Pi Camera](https://www.raspberrypi.org/products/camera-module/)
* [Inland 2,600mAh Power Bank Battery Charger for Mobile Devices](http://www.microcenter.com/product/447265/2,600mAh_Power_Bank_Battery_Charger_for_Mobile_Devices) for remote power to the Raspberry Pi.
* [L293D motor control chip](https://www.adafruit.com/product/807)

### Software

* OS - Raspbian Jessie
* Development Language - Node.js 6.0
* PWM driver - [pigpio](https://www.npmjs.com/package/pigpio)

The AI architecture is based on [Behavioral Logic](http://behaviorallogic.com/api/spec). The visual processing is from [Frogeye](https://github.com/chrisbroski/frogeye).
