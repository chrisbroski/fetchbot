/*jslint node: true, sloppy: true */

function motionLocation(ii, visionWidth, imgPixelSize) {
    var topPos = Math.floor(ii / imgPixelSize * 3),
        leftPos = (Math.floor(ii / Math.floor(visionWidth / 4)) % 4);

    return topPos * 4 + leftPos;
}

function normalize(intArray, max) {
    return intArray.map(function (item) {
        return item / max;
    });
}

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

function isTargetColor(hue, sat, targetHue, targetSat) {
    return Math.abs(hue - targetHue) + Math.abs(sat - targetSat) / 2;
}

// Tried to adapt this: http://www.quasimondo.com/archives/000696.php
function uvToHue(u, v) {
    // This is close, but I am not 100% certain it is absolutely correct.

    // First, get u and v into the -1.0 to 1.0 range for some trig.
    var angle,
        normalU = ((2 * u / 255) - 1.0) * -1,
        normalV = (2 * v / 255) - 1.0;

    // atan2 is a super useful trig function to get an angle -pi to pi
    angle = Math.atan2(normalV, normalU);
    if (angle < 0) {
        angle = Math.PI * 2 + angle;
    }

    // Then normalize the value to a range of 0.0 - 1.0
    return angle / (Math.PI * 2);
}

function uvToSat(u, v) {
    var normalU = (2 * u / 255) - 1.0,
        normalV = (2 * v / 255) - 1.0;

    return Math.sqrt(normalU * normalU + normalV * normalV);
}

function lumaProcess(luma, len, visionWidth, changeAmount) {
    var ii,
        diff,
        brightness = 0,
        motionLoc = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        contrast = [];

    for (ii = 0; ii < len; ii += 1) {
        brightness += luma.current[ii];
        if (isEdge(ii, visionWidth, len, luma.current)) {
            contrast.push(ii);
        }
        if (luma.previous.length) {
            diff = Math.abs(luma.previous[ii] - luma.current[ii]);
            if (diff > changeAmount) {
                motionLoc[motionLocation(ii, visionWidth, len)] += 1;
            }
        }
    }

    return {
        "brightness": brightness / len / 256,
        "moveLocation": normalize(motionLoc, len / 12),
        "edges": contrast
    };
}

function centerColor(chroma) {
    var centerU = (chroma.U[367] + chroma.U[368] + chroma.U[399] + chroma.U[400]) / 4,
        centerV = (chroma.V[367] + chroma.V[368] + chroma.V[399] + chroma.V[400]) / 4;

    return [uvToHue(centerU, centerV), uvToSat(centerU, centerV)];
}

function targetColorLocation(chroma, len) {
    var ii,
        hue,
        sat,
        colorDistance,
        smallestColorDistance = 0.03,
        ball = -1;

    for (ii = 0; ii < len; ii += 1) {
        hue = uvToHue(chroma.U[ii], chroma.V[ii]);
        sat = uvToSat(chroma.U[ii], chroma.V[ii]);

        colorDistance = isTargetColor(hue, sat, 0.8, 0.35);
        if (colorDistance < smallestColorDistance) {
            smallestColorDistance = colorDistance;
            ball = ii;
        }
    }

    return ball;
}

function frogeye(luma, chroma, imgPixelSize, visionWidth, changeAmount) {
    var bwData = lumaProcess(luma, imgPixelSize, visionWidth, changeAmount);

    return {
        "brightness": bwData.brightness,
        "moveLocation": bwData.moveLocation,
        "edges": bwData.edges,
        "centerColor": centerColor(chroma),
        "ball": targetColorLocation(chroma, imgPixelSize / 4)
    };
}

module.exports = frogeye;
