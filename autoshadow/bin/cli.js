"use strict";

const utils = require('../lib/utils')
const log = utils.createLogger('cli');

const ss = require('../lib');

function main() {
    ss.autosetServer().then(function() {
        log.i("working ok")
    }, function(err) {
        log.e(err)
    })
}

main()

process.on('uncaughtException', function(err) {
    error(err)
})
