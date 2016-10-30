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

    io.emit('moods', JSON.stringify(senses.setMood()));
    sendSenseData();

    socket.on('move', function (moveType) {
        actions.dispatch('move', [moveType, 1.0]);
    });

    socket.on('control', function (controlType) {
        config.manual = (controlType === 'manual');
    });

    socket.on('disconnect', function () {
        console.log('Fetchbot viewer client disconnected');
    });
});

http.listen(port, function () {
    console.log('Broadcasting to fetchbot viewer at http://0.0.0.0/:' + port);
});

// From http://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits#answer-14032965

process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, err) {
    if (err) console.log(err.stack);

    actions.dispatch("move", ["stop", 1.0]);

    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
