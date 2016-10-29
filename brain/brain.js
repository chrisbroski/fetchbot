/*jslint node: true, sloppy: true */

/*
Brain.js loads and initializes Senses, Actions, and Behaviors modules.
It also connects to a viewer for perception visualization and manual action control.
*/

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    Senses,
    Actions,
    Behaviors = require('./Behaviors.js'),
    port = 3791,
    config = {},
    senses,
    actions,
    behaviors;

config.virtual = !!process.argv[2];
config.manual = !!process.argv[3];

if (config.virtual) {
    Senses = require('./VirtualSenses.js');
    Actions = require('./VirtualActions.js');
    senses = new Senses(128, 96, true);
    actions = new Actions(senses);
} else {
    Senses = require('./Senses.js');
    Actions = require('./Actions.js');
    senses = new Senses(128, 96);
    actions = new Actions(senses);
}

behaviors = new Behaviors(senses, actions, config);

/*jslint unparam: true, nomen: true*/
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/viewer.html');
});

app.get('/img/favicon.png', function (req, res) {
    res.sendFile(__dirname + '/favicon.png');
});

if (config.virtual) {
    app.get('/virtual', function (req, res) {
        res.sendFile(__dirname + '/virtual.html');
    });
}
/*jslint unparam: false, nomen: false*/

function sendSenseData() {
    setInterval(function () {
        // send sense data to viewer 10x per second
        io.emit('senseState', JSON.stringify(senses.senseState()));
    }, 100);
}

io.on('connection', function (socket) {
    console.log('Fetchbot viewer client connected');

    sendSenseData();

    socket.on('move', function (moveType) {
        actions.dispatch('move', [moveType, 1.0]);
    });

    socket.on('control', function (controlType) {
        senses.setMood(controlType);
    });

    socket.on('disconnect', function () {
        console.log('Fetchbot viewer client disconnected');
    });
});

http.listen(port, function () {
    console.log('Broadcasting to fetchbot viewer at http://0.0.0.0/:' + port);
});
