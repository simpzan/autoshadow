"use strict";

function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

function createLogger(prefix) {
    return {
        e: winston.error.bind(null, prefix),
        w: winston.warn.bind(null, prefix),
        i: winston.info.bind(null, prefix),
        d: winston.debug.bind(null, prefix)
    }
}
var winston = require('winston');
winston.add(winston.transports.File, { filename: '/Users/simpzan/js/autoshadow/autoshadow.log' });
winston.level = 'info';

module.exports = {
    getUserHome,
    createLogger
}
