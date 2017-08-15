/*jslint node: true */

function Reddot() {
    'use strict';

    var params = {
        findRed: {
            luma: 100,
            chromaV: 190
        }
    };
    var dots = [];

    this.getParams = function getParams() {
        return params;
    }
    this.setParams = function setParams(p) {
        params[p[0]][p[1]] = p[2];
        return true;
    }

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

            if (v[ii] > params.findRed.chromaV && loc2val / 4 > params.findRed.luma) {
                dots.push(ii);
            }
        }

        return dots;
    };
}

module.exports = Reddot;
