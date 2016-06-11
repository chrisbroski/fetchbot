/*jslint node: true */

function Senses(visionWidth, visionHeight) {
    'use strict';

    // Import libraries
    var spawn = require('child_process').spawn,

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
    state.currentAction = {action: '', parameters: []};

    // *mood* is a peristent indicator of a creature's short-term goal
    // They are set with a duration and will automatically remove themselves after time expires
    state.mood = [];

    // *Perceptions* are the results of processing raw sense state
    // They can only be written by perceivers, but can be read by anything
    state.perceptions = {
        dimensions: [visionWidth, visionHeight],
        brightnessOverall: 0.0,
        motion: 0.0,
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
        state.currentAction.action = type;
        state.currentAction.parameters = params;
    };

    moods = {
        searching: 60,
        chasing: 60,
        stuck: 30,
        relaxing: 60,
        sleepy: 300
    };

    this.setMood = function setMood(moodType) {
        // if no type is given, return a list of available types and parameters
        if (!moodType) {
            return JSON.stringify(moods, null, '    ');
        }

        // if not a legal mood, return false
        if (!moods[moodType]) {
            return false;
        }
        // if mood is already active, add time to it
        // otherwise, add it with time
        // time is set to current timestamp + duration
        //state.mood.push(moods[moodType]);
    };

    function isEdge(ii, visionWidth, imgPixelSize, luma) {
        var val = luma[ii], compare, difference = 50;
        // check top, right, bottom, and left for a significant increase in luma

        // Top
        if (ii > visionWidth) {
            compare = luma[ii - visionWidth];
            if (compare - val > difference) {
                return true;
            }
        }

        // Bottom
        if (ii < imgPixelSize - visionWidth) {
            compare = luma[ii + visionWidth];
            if (compare - val > difference) {
                return true;
            }
        }

        // Left
        if (ii % visionWidth > 0) {
            compare = luma[ii - 1];
            if (compare - val > difference) {
                return true;
            }
        }

        // Right
        if (ii % visionWidth < visionWidth - 1) {
            compare = luma[ii + 1];
            if (compare - val > difference) {
                return true;
            }
        }
    }

    function findEdges(luma, len, visionWidth) {
        var ii,
            contrast = [];

        for (ii = 0; ii < len; ii += 1) {
            if (isEdge(ii, visionWidth, len, luma)) {
                contrast.push(ii);
            }
        }

        return contrast;
    }

    // Tried to adapt this: http://www.quasimondo.com/archives/000696.php
    function uvToHue(u, v) {
        var angle,

            // first, get u and v into the -1.0 to 1.0 range for some trig
            normalU = (-2 * u / 255) + 1.0,
            normalV = (2 * v / 255) - 1.0;

        // atan2 is a super useful trig function to get an angle -pi to pi
        angle = Math.atan2(normalU, normalV);
        if (angle < 0) {
            angle = Math.PI * 2 + angle;
        }

        // Then normalize the value to 0.0 - 1.0
        return angle / (Math.PI * 2);
    }

    function uvToSat(u, v) {
        var normalU = (2 * u / 255) - 1.0,
            normalV = (2 * v / 255) - 1.0;

        return Math.sqrt(normalU * normalU + normalV * normalV);
    }

    function findTargets(u, v, len) {
        var ii,
            hueTolerance = 0.03,
            satTolerance = 0.20,
            hueDif,
            satDif,
            hits = [];

        for (ii = 0; ii < len; ii += 1) {
            hueDif = Math.abs(uvToHue(u[ii], v[ii]) - 0.056);
            if (hueDif > 0.5) {
                hueDif = Math.abs(hueDif - 1.0);
            }
            satDif = Math.abs(uvToSat(u[ii], v[ii]) - 0.81);
            if (hueDif <= hueTolerance && satDif <= satTolerance) {
                hits.push(ii);
            }
        }

        return hits;
    }

    function detectMotion(contrastPointAmount, luma, len) {
        var ii, diff, changeAmount = 20, moveCount = 0;
        if (luma.previous.length) {
            for (ii = 0; ii < len; ii += 1) {
                diff = Math.abs(luma.previous[ii] - luma.current[ii]);
                if (diff > changeAmount) {
                    moveCount += 1;
                }
            }
        }
        return moveCount / contrastPointAmount;
    }

    // *Perceivers* process raw sense state into meaningful information
    perceivers.frogEye = function (imgPixelSize) {
        state.perceptions.edges = findEdges(raw.luma.current, imgPixelSize, visionWidth);
        state.perceptions.targets = findTargets(raw.chroma.U, raw.chroma.V, imgPixelSize / 4);
        state.perceptions.motion = detectMotion(state.perceptions.edges.length, raw.luma, imgPixelSize);
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

    // *Attention* is responsible for triggering observers and perceivers.
    attention = {};
    attention.look = function (timeLapseInterval) {
        var imgPixelSize = visionWidth * visionHeight,
            imgRawFileSize = imgPixelSize * 1.5,
            cam;

        timeLapseInterval = timeLapseInterval || 0;
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
    };

    function init() {
        console.log('Initialize senses module');
        attention.look(250);
    }

    init();
}

module.exports = Senses;
