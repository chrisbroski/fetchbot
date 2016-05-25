function Actions(senses) {
    'use strict';

    // Action performers
    var performer = {},
        // global values
        gpio = require('pigpio').Gpio,
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
    performer.move = function move(params) {
        var id;

        type = params.type || 'stop';

        // take action
        //senses.currentAction('move', id, params);
    };

    performer.move.params = [
        {
            description: 'type',
            values: [
                'forward',
                'forward-right',
                'rotate-right',
                'back-right',
                'backward',
                'back-left',
                'rotate-left',
                'forward-left'
            ],
            default: 'stop'
        }
    ];

    this.dispatch = function actionDispatch(type, params) {
        var currentAction = senses.senseState().currentAction, actions = [];

        // if no type is given, return a list of available types and parameters
        if (!type) {
            Object.keys(performer).forEach(function (act) {
                actions.push({
                    action: act,
                    parameters: performer[act].params
                });
            });

            return JSON.stringify(actions, null, '    ');
        }

        if (type === 'move') {
            performer.move(params);
        }
    };

    function init() {
        rightEnable.digitalWrite(1);
        leftEnable.digitalWrite(1);
        stop();
    }

    init();
}
