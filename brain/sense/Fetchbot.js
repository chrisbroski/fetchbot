/*jslint node: true */

global.params.senses.findRed = {};
global.params.senses.findRed.luma = 100;
global.params.senses.findRed.chromaV = 190;
global.params.senses.edge = {};
global.params.senses.edge.diff = 50;
global.params.senses.isCenter = {};
global.params.senses.isCenter.width = 0.2;

function Fetchbot() {
    'use strict';

    var dots = [];

    function isEdge(ii, visionWidth, imgPixelSize, luma) {
        var adjacent = [], val = luma[ii], diff = global.params.senses.edge.diff;

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
            return (compare - val > diff);
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
        var centerWidth = global.params.senses.isCenter.width,
            leftSide = (1.0 - centerWidth) / 2.0,
            rightSide = leftSide + centerWidth;
        //go through dots. Add up each column
        // Return the column index with the greatest value
        var redCount = [0, 0, 0];
        dots.forEach(function (dot) {
            var colNum = ((dot - 1) % visionWidth) + 1;
            if (colNum < visionWidth * leftSide) {
                redCount[0] += 1;
            } else if (colNum > visionWidth * rightSide) {
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

            if (v[ii] > global.params.senses.findRed.chromaV && loc2val / 4 > global.params.senses.findRed.luma) {
                dots.push(ii);
            }
        }

        return dots;
    };
}

module.exports = Fetchbot;
