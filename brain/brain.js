/*jslint node: true, sloppy: true, bitwise: true, nomen: true */

/*
Brain.js loads and initializes Senses, Actions, and Behaviors modules.
It also connects to a viewer for perception visualization and manual action control.
*/

global.params = {};
global.params.senses = {};

var fs = require('fs'),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io')(server),
    Senses = require('./Senses.js'),
    Actions = require('./Actions.js'),
    Behaviors = require('./Behaviors.js'),
    port = 3791,
    config = {},
    senses,
    actions,
    behaviors,
    prevStateString = "";

config.manual = !!process.argv[3];

senses = new Senses(128, 96, !!process.argv[2]);
actions = new Actions(senses, !!process.argv[2]);
behaviors = new Behaviors(senses, actions, config);

function app(req, rsp) {
    if (req.url === "/img/favicon.png") {
        rsp.writeHead(200, {'Content-Type': 'image/png'});
        fs.createReadStream(__dirname + '/favicon.png').pipe(rsp);
    } else if (req.url === "/viewer.css") {
        rsp.writeHead(200, {'Content-Type': 'text/css'});
        fs.createReadStream(__dirname + '/viewer.css').pipe(rsp);
    } else if (req.url === "/viewer.js") {
        rsp.writeHead(200, {'Content-Type': 'application/javascript'});
        fs.createReadStream(__dirname + '/viewer.js').pipe(rsp);
    } else {
        rsp.writeHead(200, {'Content-Type': 'text/html'});
        fs.createReadStream(__dirname + '/viewer.html').pipe(rsp);
    }
}

/*jslint unparam: false, nomen: false*/

function sendSenseData() {
    setInterval(function () {
        var stateString = JSON.stringify(senses.senseState());

        // if changed, send sense data to viewer 10x per second
        // This needs to accomodate viewer refresh
        if (stateString !== prevStateString) {
            prevStateString = stateString;
            io.emit('senseState', stateString);
            io.emit('senseRaw', senses.senseRaw());
        }
    }, 100);
}

io.on('connection', function (socket) {
    console.log('Fetchbot viewer client connected');

    //io.emit('moods', JSON.stringify(senses.setMood()));
    io.emit('actions', JSON.stringify(actions.dispatch()));
    io.emit('behaviors', JSON.stringify(global.behaviorTable));
    io.emit('getSenseParams', JSON.stringify(global.params.senses));
    io.emit('getActionParams', JSON.stringify(global.params.actions));
    sendSenseData();

    socket.on("action", function (actionData) {
        var actionArray = JSON.parse(actionData);
        actions.dispatch(actionArray[0], actionArray[1], actionArray[2]);
    });

    socket.on('control', function (controlType) {
        config.manual = (controlType === 'manual');
    });

    socket.on('btable', function (btable) {
        behaviors.updateBTable(JSON.parse(btable));
    });

    socket.on('setsenseParam', function (senseParams) {
        var arrayParams = senseParams.split(",");
        console.log(arrayParams);
        global.params.senses[arrayParams[0]][arrayParams[1]] = +arrayParams[2];
        senses.perceive();
    });

    socket.on('disconnect', function () {
        console.log('Fetchbot viewer client disconnected');
    });
});

server.listen(port, function () {
    console.log('Broadcasting to fetchbot viewer at http://0.0.0.0/:' + port);
});

// Code below is to handle exits more gracefully
// From http://stackoverflow.com/questions/14031763/#answer-14032965

process.stdin.resume();

function exitHandler(options, err) {
    if (err) {
        console.log(err.stack);
    }

    actions.dispatch("perform", "move", {"type": "stop", "speed": 1.0});

    if (options.exit) {
        process.exit();
    }
}

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
