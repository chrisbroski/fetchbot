/*jslint node: true */

function Frogeye(edgeDifference, targetHS) {
    'use strict';

    function isEdge(ii, visionWidth, imgPixelSize, luma) {
        var val = luma[ii], compare;
        // check top, right, bottom, and left for a significant increase in luma

        // Top
        if (ii > visionWidth) {
            compare = luma[ii - visionWidth];
            if (compare - val > edgeDifference) {
                return true;
            }
        }

        // Bottom
        if (ii < imgPixelSize - visionWidth) {
            compare = luma[ii + visionWidth];
            if (compare - val > edgeDifference) {
                return true;
            }
        }

        // Left
        if (ii % visionWidth > 0) {
            compare = luma[ii - 1];
            if (compare - val > edgeDifference) {
                return true;
            }
        }

        // Right
        if (ii % visionWidth < visionWidth - 1) {
            compare = luma[ii + 1];
            if (compare - val > edgeDifference) {
                return true;
            }
        }
    }

    this.findEdges = function findEdges(luma, len, visionWidth) {
        var ii,
            contrast = [];

        for (ii = 0; ii < len; ii += 1) {
            if (isEdge(ii, visionWidth, len, luma)) {
                contrast.push(ii);
            }
        }

        return contrast;
    };

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

    this.findTargets = function findTargets(u, v, len) {
        var ii,
            hueTolerance = 0.03,
            satTolerance = 0.20,
            hueDif,
            satDif,
            hits = [];

        for (ii = 0; ii < len; ii += 1) {
            hueDif = Math.abs(uvToHue(u[ii], v[ii]) - targetHS[0]);
            if (hueDif > 0.5) {
                hueDif = Math.abs(hueDif - 1.0);
            }
            satDif = Math.abs(uvToSat(u[ii], v[ii]) - targetHS[1]);
            if (hueDif <= hueTolerance && satDif <= satTolerance) {
                hits.push(ii);
            }
        }

        return hits;
    };

    this.detectMotion = function detectMotion(contrastPointAmount, luma, len) {
        var ii, diff, moveCount = 0;
        if (luma.previous.length) {
            for (ii = 0; ii < len; ii += 1) {
                diff = Math.abs(luma.previous[ii] - luma.current[ii]);
                if (diff > edgeDifference) {
                    moveCount += 1;
                }
            }
        }
        return moveCount / contrastPointAmount;
    };
}

module.exports = Frogeye;