/*jslint node: true */

var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = 3789,
    Senses = require('./Senses.js'),
    senses = new Senses(64, 48);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/viewer.html');
});

app.get('/img/favicon.png', function (req, res) {
    res.sendFile(__dirname + '/img/favicon.png');
});

function sendSenseData() {
    setInterval(function () {
        // send sense data to viewer 100x per second
        io.emit('senseState', JSON.stringify(senses.senseState()));
    }, 20);
}

io.on('connection', function (socket) {
    console.log('Frogeye viewer client connected');

    sendSenseData();

    socket.on('disconnect', function () {
        console.log('Frogeye viewer client disconnected');
    });
});

http.listen(port, function () {
    console.log('Frogeye view server listening on http://0.0.0.0/:' + port);
});
