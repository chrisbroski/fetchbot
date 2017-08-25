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
    stateHash = 0;

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

/* From http://stackoverflow.com/questions/7616461#answer-7616484 */
function hashCode(s) {
    var hash = 0, i, chr, len = s.length;
    if (len === 0) {
        return hash;
    }
    for (i = 0; i < len; i += 1) {
        chr = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

/*jslint unparam: false, nomen: false*/

function sendSenseData() {
    setInterval(function () {
        var stateString = JSON.stringify(senses.senseState()),
            newStateHash = hashCode(stateString);

        // if changed, send sense data to viewer 10x per second
        if (newStateHash !== stateHash) {
            stateHash = newStateHash;
            io.emit('senseState', stateString);
            io.emit('senseRaw', senses.senseRaw());
        }
    }, 100);
}

io.on('connection', function (socket) {
    console.log('Fetchbot viewer client connected');

    //io.emit('moods', JSON.stringify(senses.setMood()));
    io.emit('actions', JSON.stringify(actions.dispatch()));
    io.emit('behaviors', JSON.stringify(behaviors.behaviorTable()));
    io.emit('getSenseParams', JSON.stringify(global.params.senses));
    sendSenseData();

    socket.on('move', function (moveType) {
        actions.dispatch(['move', {"type": moveType, "speed": 1.0}]);
    });

    socket.on('control', function (controlType) {
        config.manual = (controlType === 'manual');
    });

    socket.on('setSenseParam', function (senseParams) {
        var arrayParams = senseParams.split(",");
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

    actions.dispatch("move", ["stop", 1.0]);

    if (options.exit) {
        process.exit();
    }
}

process.on('exit', exitHandler.bind(null, {cleanup: true}));
process.on('SIGINT', exitHandler.bind(null, {exit: true}));
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));
