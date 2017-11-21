/*jslint node: true */

// Set global params: global.params[module name][param name]
global.params.reddot = {};
global.params.reddot.findRed = {};
global.params.reddot.findRed.luma = 100;
global.params.reddot.findRed.chromaV = 190;

function Reddot() {
    'use strict';

    var dots = [];

    /*var params = {
        findRed: {
            luma: 100,
            chromaV: 190
        }
    };

    this.getParams = function getParams() {
        return params;
    }
    this.setParams = function setParams(p) {
        params[p[0]][p[1]] = p[2];
        return true;
    }*/

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
            loc2val,
            redChromaV = global.params.reddot.findRed.chromaV,
            redLuma = global.params.reddot.findRed.luma;

        dots.length = 0;

        function loc2valReduce(a, b) {
            return a + l[b];
        }

        for (ii = 0; ii < len; ii += 1) {
            loc2 = loc2x(ii, visionWidth);
            loc2val = loc2.reduce(loc2valReduce, 0);

            if (v[ii] > redChromaV && loc2val / 4 > redLuma) {
                dots.push(ii);
            }
        }

        return dots;
    };
}

module.exports = Reddot;
