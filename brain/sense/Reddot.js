/*jslint node: true */

function Reddot() {
    'use strict';

    function loc2x(i, visionWidth) {
        var row = Math.floor(i / visionWidth) + 1;
        var col = i % visionWidth + 1;
        var row2 = (row - 1) * 2 + 1;
        var col2 = (col - 1) * 2 + 1;

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

            loc2val = +l[loc2[0]] + +l[loc2[1]] + +l[loc2[2]] + +l[loc2[3]];
            if (v[ii] > 190 && loc2val / 4 > 130) {
                contrast.push(ii);
            }
        }

        return contrast;
    };
}

module.exports = Reddot;
