/*jslint node: true */

function Senses(visionWidth, visionHeight, virtual) {
    'use strict';

    // Import libraries
    var spawn = require('child_process').spawn,
        fs = require("fs"),
        Frogeye = require('./sense/Frogeye.js'),
        frogEye = new Frogeye(50, [15.9, 0.41]), // Edge contrast, target hue and saturation
        Reddot = require('./sense/Reddot.js'),
        reddot = new Reddot(),

        // Declare private objects
        raw = {},
        state = {},
        observers = {},
        perceivers = {},
        attention = {},
        moods,
        partialImgData = '';

    // *Raw* state is unprocessed environment measurements received from sensors.
    // Raw state can only be written by observers and only read by perceivers
    raw.luma = {current: [], previous: []};
    raw.chroma = {U: [], V: []};

    // *Sense state* is a collection of all current sensory data.

    // *current action* indicates what the creature is doing
    state.currentAction = {type: '', parameters: []};

    // *mood* is a peristent indicator of a creature's short-term goal
    // They are set with a duration and will automatically remove themselves after time expires
    state.mood = [];

    // *Perceptions* are the results of processing raw sense state
    // They can only be written by perceivers, but can be read by anything
    state.perceptions = {
        dimensions: [visionWidth, visionHeight],
        brightnessOverall: 0.0,
        motion: 0.0,
        targetDirection: [0, 0, 0],
        targets: [],
        edges: []
    };

    // Sense state is publically readable (but not changeable).
    this.senseState = function (type) {
        if (type) {
            if (type === 'mood' || type === 'currentAction') {
                return JSON.parse(JSON.stringify(state[type]));
            }
            return JSON.parse(JSON.stringify(state.perceptions[type]));
        }
        return JSON.parse(JSON.stringify(state));
    };

    // *current action* can be modified by the Actions module
    this.currentAction = function currentAction(type, params) {
        state.currentAction.type = type;
        state.currentAction.parameters = params;
    };

    moods = {
        searching: 60,
        chasing: 60,
        stuck: 30,
        relaxing: 60,
        sleepy: 300
    };

    function hasMood(moodType) {
        var ii, len = state.mood.length;
        for (ii = 0; ii < len; ii += 1) {
            if (moodType === state.mood[ii].name) {
                return ii;
            }
        }
        return -1;
    }

    function cleanupMoods() {
        var ii, len = state.mood.length, currentTime = +(new Date());
        for (ii = len - 1; ii > -1; ii -= 1) {
            if (state.mood[ii].expires < currentTime) {
                state.mood.splice(ii, 1);
            }
        }
    }

    this.setMood = function setMood(moodType) {
        var moodIndex, expTime;
        // if no type is given, return a list of available types and parameters
        if (!moodType) {
            return moods;
        }

        // if not a legal mood, return false
        if (!moods[moodType]) {
            return false;
        }

        moodIndex = hasMood(moodType);
        expTime = +(new Date()) + (moods[moodType] * 1000);

        if (moodIndex > -1) {
            state.mood[moodIndex].expires = expTime;
        } else {
            state.mood.push({"name": moodType, "expires": expTime});
        }
    };

    // *Perceivers* process raw sense state into meaningful information
    perceivers.frogEye = function (imgPixelSize) {
        state.perceptions.edges = frogEye.findEdges(raw.luma.current, imgPixelSize, visionWidth);
        state.perceptions.targets = frogEye.findTargets(raw.chroma.U, raw.chroma.V, imgPixelSize / 4);
        state.perceptions.motion = frogEye.detectMotion(state.perceptions.edges.length, raw.luma, imgPixelSize);
        state.perceptions.targetDirection = frogEye.ballDirection(raw.chroma.U, raw.chroma.V, imgPixelSize / 4, visionWidth / 2);
    };

    // *Observers* populate raw sense state from a creature's sensors.
    observers.vision = function (yuvData, imgRawFileSize, imgPixelSize) {
        var lumaData = [],
            chromaU = [],
            chromaV = [],
            brightness = 0,
            ii;

        // The Pi camera gives a lot of crap data in yuv time lapse mode.
        // This recovers some of it
        if (yuvData.length < imgRawFileSize - 1) {
            if (yuvData.length + partialImgData.length === imgRawFileSize) {
                yuvData = Buffer.concat([partialImgData, yuvData], imgRawFileSize);
            } else {
                partialImgData = yuvData;
                return;
            }
        }
        partialImgData = '';

        // Data conversion. In this case an array is built from part of a binary buffer.
        for (ii = 0; ii < imgPixelSize; ii += 1) {
            lumaData.push(yuvData.readUInt8(ii));
            brightness += yuvData.readUInt8(ii);
        }
        for (ii = imgPixelSize; ii < imgPixelSize * 1.25; ii += 1) {
            chromaU.push(yuvData.readUInt8(ii));
        }
        for (ii = imgPixelSize * 1.25; ii < imgPixelSize * 1.5; ii += 1) {
            chromaV.push(yuvData.readUInt8(ii));
        }

        // Set raw global sense state
        raw.luma.previous = raw.luma.current;
        raw.luma.current = lumaData;
        raw.chroma.U = chromaU;
        raw.chroma.V = chromaV;

        /*
        Perceivers should typically be handled by the attention object as a separate
        process, but for simplicity we'll just fire them off after the observer completes.
        */
        state.perceptions.brightnessOverall = brightness / imgPixelSize / 256;
        perceivers.frogEye(imgPixelSize);
    };

    // Other observers can be added here for sound, temperature, velocity, smell, whatever.

    // virtual input
    function virt(imgRawFileSize, imgPixelSize) {
        fs.readFile(__dirname + '/reddot.raw', function (err, data) {
            if (err) {
                throw err;
            }
            observers.vision(data, imgRawFileSize, imgPixelSize);
        });
    }

    // *Attention* is responsible for triggering observers and perceivers.
    attention = {};
    attention.look = function (timeLapseInterval) {
        var imgPixelSize = visionWidth * visionHeight,
            imgRawFileSize = imgPixelSize * 1.5,
            cam;

        timeLapseInterval = timeLapseInterval || 0;

        if (virtual) {
            virt(imgRawFileSize, imgPixelSize);
        } else {
            /*
            For better color detection, I recommend disabling the Pi camera light by adding
            `disable_camera_led=1` to the /boot/config.txt file
            */
            cam = spawn('raspiyuv', [
                '-w', visionWidth.toString(10),
                '-h', visionHeight.toString(10),
                //'-p', '50, 80, 400, 300', // small preview window
                '--nopreview',
                '-awb', 'fluorescent', // color detection more consistent
                '-bm', // Burst mode - this causes a significant improvement in frame rate
                '-vf', // My camera is upside-down so flip the image vertically
                '-tl', timeLapseInterval.toString(10), // 0 = as fast as possible
                '-t', '300000', // Restart every 5 min
                '-o', '-' // To stdout
            ]);

            cam.stdout.on('data', function (data) {
                observers.vision(data, imgRawFileSize, imgPixelSize);
            });

            cam.stderr.on('data', function (data) {
                console.log('stderr: ' + data);
            });

            cam.on('exit', function (code) {
                console.log('raspiyuv process exited with code ' + code);
                console.log('Restarting raspiyuv time lapse');
                attention.look(250);
            });
        }
    };

    function init() {
        console.log('Initialize senses module');
        attention.look(250);
        setInterval(cleanupMoods, 5000);
    }

    init();
}

module.exports = Senses;
