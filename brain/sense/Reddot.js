/*jslint node: true */

function Reddot() {
    'use strict';

    function isRedEdge(ii, visionWidth, imgPixelSize, v, difference, u) {
        var adjacent = [];
        var edge;

        if (ii > visionWidth) {
            adjacent.push(v[ii - visionWidth]); // top
        }
        if (ii % visionWidth < visionWidth - 1) {
            adjacent.push(v[ii + 1]); // right
        }
        if (ii < imgPixelSize - visionWidth) {
            adjacent.push(v[ii + visionWidth]); // bottom
        }
        if (ii % visionWidth > 0) {
            adjacent.push(v[ii - 1]); // left
        }

        // if all adjacent luma < threshold, perist previous
        /*function isAllAdjacentBelowDiff() {
            return adjacent.every(function (adj) {
                return adj < threshold;
            });
        }
        if (isAllAdjacentBelowDiff()) {
            return (previous.edges.indexOf(ii) > -1);
        }*/

        // If previous is true, decrease difference by, say 10%? (until jitter stops)
        /*edge = luma[ii] * difference;
        if (state.edge.previous.indexOf(ii) > -1) {
            edge = edge * 0.9;
        }*/

        // check adjacent for a significant increase in luma
        //console.log(ii, u[ii]);
        return adjacent.some(function (compare) {
            //console.log(u[ii], compare, u[ii] - compare);
            return (v[ii] - compare > difference && v[ii] > 150);
        });
        //return (Math.random() > 0.9);
    }

    function loc2x(i, visionWidth) {
        var row = Math.floor(i / visionWidth);
        var col = i % visionWidth;

        return [
            col * 2 + row * 2,
            col * 2 + row * 2 + 1,
            col * 2 + row * 2 + visionWidth * 2,
            col * 2 + row * 2 + visionWidth * 2 + 1
        ];
    }

    this.findRedEdges = function findRedEdges(v, visionWidth, l) {
        var ii,
            contrast = [],
            len = v.length,
            loc2;
        console.log(l);

        for (ii = 0; ii < len; ii += 1) {
            /*if (isRedEdge(ii, visionWidth, len, v, 10)) {
                contrast.push(ii);
            }*/
            loc2 = loc2x(ii, visionWidth);
            if (l[loc2[0]] > 190 || l[loc2[1]] > 190 || l[loc2[2]] > 190 || l[loc2[3]] > 190) {
                contrast.push(ii);
            }
        }

        return contrast;
    };
    this.findBlueEdges = function findBlueEdges(u, visionWidth) {
        var ii,
            contrast = [],
            len = u.length;

        for (ii = 0; ii < len; ii += 1) {
            if (isRedEdge(ii, visionWidth, len, u, 30)) {
                contrast.push(ii);
            }
        }

        return contrast;
    };
    /*function isEdge(ii, visionWidth, imgPixelSize, luma) {
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

        // Then normalize the value to 0.0 - 360.0
        return angle / (Math.PI * 2) * 360;
    }

    function uvToSat(u, v) {
        var normalU = (2 * u / 255) - 1.0,
            normalV = (2 * v / 255) - 1.0;

        return Math.sqrt(normalU * normalU + normalV * normalV);
    }

    function isTargetColor(U, V) {
        var hueTolerance = 1.5,
            satTolerance = 0.20,
            hueDif,
            satDif;

        hueDif = Math.abs(uvToHue(U, V) - targetHS[0]);
        if (hueDif > 180) {
            hueDif = Math.abs(hueDif - 180);
        }
        satDif = Math.abs(uvToSat(U, V) - targetHS[1]);
        return (hueDif <= hueTolerance && satDif <= satTolerance);
    }

    this.findTargets = function findTargets(u, v, len) {
        var ii, hits = [];

        for (ii = 0; ii < len; ii += 1) {
            if (isTargetColor(u[ii], v[ii])) {
                hits.push(ii);
            }
        }

        return hits;
    };

    this.ballDirection = function ballDirection(u, v, len, visionWidth) {
        var hits = [0, 0, 0], ii;

        for (ii = 0; ii < len; ii += 1) {
            if (isTargetColor(u[ii], v[ii])) {
                hits[Math.floor((ii % visionWidth) / (visionWidth / 3))] += 1;
            }
        }

        return hits;
    };*/

    /*this.edges = function (u, visionWidth) {
        //return [];
        return findRedEdges(u, visionWidth, u.length);
    };*/
}

module.exports = Reddot;
