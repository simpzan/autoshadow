"use strict";

const utils = require('./utils')
const log = utils.createLogger('shadowsocksManager');

const configManager = require('./configManager');
const isConnectable = require("./isConnectable");

function runCmd(cmd) {
    log.d(`running cmd:\n${cmd}`)
    const args = cmd.split(" ");
    return require('child_process').spawn(args[0], args.slice(1));
}

function getShadowsocksCmd(c) {
    const cmdFile = `python ${__dirname}/../shadowsocks/shadowsocks/local.py`;
    const args = `-s ${c.server} -p ${c.server_port} -m ${c.method} -k ${c.password} -l ${c.local_port}`
    return `${cmdFile} ${args}`
}


let ss;
function stopProxy() {
    return new Promise(function(resolve, reject) {
        if (!ss) return resolve();

        ss.once("exit", function(err) {
            if (err) reject(err)
            else resolve();
        })
        ss.kill();
        ss = null;
    });
}

function startProxy(config) {
    stopProxy();
    const cmd = getShadowsocksCmd(config);
    ss = runCmd(cmd);

    return new Promise((resolve, reject) => {
        // ss.stdout.once('data', resolve);
        // ss.stdout.on('data', cmdOutputHandler);
        ss.stderr.once('data', resolve);
        ss.stderr.on('data', cmdOutputHandler);
        ss.once("error", (err) => {
            log.e("failed to run cmd", err, cmd);
            reject(err)
        });

        function cmdOutputHandler(data) {
            if (!isScanning) utils.log("shadowsocks", data.toString().trim());
        }
    });
}


function isProxyConnectable(server) {
    const localPort = configManager.getLocalPort();
    server.local_port = localPort;
    const url = 'http://www.google.com';
    return startProxy(server).then(() => isConnectable(url, localPort));
}


let isScanning = false;
function autoscan() {
    return new Promise((resolve, reject) => {
        const servers = configManager.getServers();
        const currentIndex = configManager.getCurrentServer().index;
        const sequence = utils.generateSequence(servers.length, currentIndex);
        const async = require('async')
        isScanning = true;
        async.detectSeries(sequence, (index, callback) => {
            const server = servers[index];
            log.i("checking", index, server.server);
            isProxyConnectable(server).then(
                () => callback(null, true),
                () => callback(null, false)
            );
        }, (err, result) => {
            log.i("autoscan done", err, result);
            isScanning = false;
            if (err) {
                reject(err);
            } else if (result === undefined) {
                reject(new Error(`no usable config found!`));
            } else {
                resolve(result);
                configManager.setCurrentServerIndex(result);
            }
        });
    });
}


module.exports = {
    run: startProxy,
    quit: stopProxy,
    autosetServer: autoscan,
}
