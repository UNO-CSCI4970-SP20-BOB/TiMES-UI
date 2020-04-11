"use strict";

const PROD = process.env.NODE_ENV === 'production';

module.exports = {
    target: 'web',
    output: {
        filename: 'script.js',
    },
    devtool: PROD ? '' : 'eval',
}