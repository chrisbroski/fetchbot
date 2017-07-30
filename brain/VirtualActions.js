/*jslint node: true */

function Actions() {
    'use strict';

    this.dispatch = function actionDispatch(type, params) {
        console.log(type, params);
    };
}

module.exports = Actions;
