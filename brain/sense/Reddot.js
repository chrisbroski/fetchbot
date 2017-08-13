/*jslint node: true */

function Reddot() {
    'use strict';

    var params = {
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
    }

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

    this.findRedEdges = function findRedEdges(v, visionWidth, l) {
        var ii,
            contrast = [],
            len = v.length,
            loc2,
            loc2val;

        for (ii = 0; ii < len; ii += 1) {
            loc2 = loc2x(ii, visionWidth);

            //loc2val = +l[loc2[0]] + +l[loc2[1]] + +l[loc2[2]] + +l[loc2[3]];
            loc2val = loc2.reduce(function (a, b) {
                return a + l[b];
            }, 0);

            if (v[ii] > params.findRed.chromaV && loc2val / 4 > params.findRed.luma) {
                contrast.push(ii);
            }
        }

        return contrast;
    };
}

module.exports = Reddot;
