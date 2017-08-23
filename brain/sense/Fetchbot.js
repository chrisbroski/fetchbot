/*jslint node: true */

global.params.fetchbot = {};
global.params.fetchbot.findRed = {};
global.params.fetchbot.findRed.luma = 100;
global.params.fetchbot.findRed.chromaV = 190;
global.params.fetchbot.edge = {};
global.params.fetchbot.edge.diff = 50;

function Fetchbot() {
    'use strict';

    var dots = [];

    function isEdge(ii, visionWidth, imgPixelSize, luma) {
        var adjacent = [], val = luma[ii], difference = global.params.fetchbot.edge.diff;

        if (ii > visionWidth) {
            adjacent.push(luma[ii - visionWidth]); // top
        }
        if (ii % visionWidth < visionWidth - 1) {
            adjacent.push(luma[ii + 1]); // right
        }
        if (ii < imgPixelSize - visionWidth) {
            adjacent.push(luma[ii + visionWidth]); // bottom
        }
        if (ii % visionWidth > 0) {
            adjacent.push(luma[ii - 1]); // left
        }

        // check adjacent for a significant increase in luma
        return adjacent.some(function (compare) {
            return (compare - val > difference);
        });
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

    function redColumns(visionWidth) {
        //go through dots. Add up each column
        // Return the column index with the greatest value
        var redCount = [0, 0, 0];
        dots.forEach(function (dot) {
            var colNum = ((dot - 1) % visionWidth) + 1;
            if (colNum < visionWidth * 0.4) {
                redCount[0] += 1;
            } else if (colNum > visionWidth * 0.6) {
                redCount[2] += 1;
            } else {
                redCount[1] += 1;
            }
        });
        return redCount;
    }
    this.redColumns = redColumns;

    function loc2x(i, visionWidth) {
        var row = Math.floor(i / visionWidth) + 1,
            col = i % visionWidth + 1,
            row2 = (row - 1) * 2 + 1,
            col2 = (col - 1) * 2 + 1;

        return [
            row2 * visionWidth * 2 + col2,
            row2 * visionWidth * 2 + col2 + 1,
            row2 * visionWidth * 2 + col2 + (visionWidth * 2),
            row2 * visionWidth * 2 + col2 + (visionWidth * 2) + 1
        ];
    }

    this.findBrightRed = function findBrightRed(v, visionWidth, l) {
        var ii,
            len = v.length,
            loc2,
            loc2val;

        dots.length = 0;

        for (ii = 0; ii < len; ii += 1) {
            loc2 = loc2x(ii, visionWidth);

            loc2val = loc2.reduce(function (a, b) {
                return a + l[b];
            }, 0);

            if (v[ii] > global.params.fetchbot.findRed.chromaV && loc2val / 4 > global.params.fetchbot.findRed.luma) {
                dots.push(ii);
            }
        }

        return dots;
    };
}

module.exports = Fetchbot;
