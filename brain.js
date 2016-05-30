/*jslint node: true, sloppy: true */

/*
load and initialize senses, actions, and behaviors
support sense viewer
*/

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = 3791,
    Senses = require('./Senses.js'),
    senses = new Senses(64, 48),
    Actions = require('./Actions.js'),
    actions = new Actions(senses);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/brain.html');
});

app.get('/img/favicon.png', function (req, res) {
    res.sendFile(__dirname + '/frogeye/img/favicon.png');
});

function sendSenseData() {
    setInterval(function () {
        // send sense data to viewer 10x per second
        io.emit('senseState', JSON.stringify(senses.senseState()));
    }, 100);
}

io.on('connection', function (socket) {
    console.log('Brain viewer client connected');

    sendSenseData();

    /*actions.dispatch('move', 'forward');
    setTimeout(function () {
        actions.dispatch('move', 'stop');
    }, 2000);*/

    /*socket.on('move', function (moveType) {
        console.log('move', moveType);
        actions.dispatch('move', moveType);
    });*/

    socket.on('disconnect', function () {
        console.log('Frogeye viewer client disconnected');
    });
});

http.listen(port, function () {
    console.log('Frogeye view server listening on http://0.0.0.0/:' + port);
});
