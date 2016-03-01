"use strict";

const utils = require('../lib/utils')
const log = utils.createLogger('cli');
const error = log.e;
const warn = log.w;
const info = log.i;
const debug = log.d;

const co = require('co');
const ss = require('../lib');

function main() {
    co(ss.autosetServer).then(function() {
        info("working ok")
    }, function(err) {
        error(err)
    })
}

main()

process.on('uncaughtException', function(err) {
    error(err)
})
