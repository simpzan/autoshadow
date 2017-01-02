"use strict";

const utils = require('./utils')
const log = utils.createLogger('shadowsocksManager');
const error = log.e;
const warn = log.w;
const debug = log.d;
const info = log.i;

const configManager = require('./configManager.js');

function runCmd(cmd, prefix) {
    debug("running cmd:\n" + cmd)
    const args = cmd.split(" ");
    const ss = require('child_process').spawn(args[0], args.slice(1));

    function stopCmd() {
        return new Promise(function(resolve, reject) {
            ss.on("exit", function(err) {
                if (err) reject(err)
                else resolve();
            })
            ss.kill();
        })
    }
    return new Promise(function(resolve, reject) {
        function cmdOutputHandler(data) {
            if (!isScanning) info(prefix, data.toString().trim());
            resolve(stopCmd);
        }
        ss.stdout.on('data', cmdOutputHandler);
        ss.stderr.on('data', cmdOutputHandler);
        ss.on("error", function(err) {
            error("failed to run cmd", err, cmd);
            reject(err)
        });
    })
}

function start(config) {
    debug("start", config)
    function getCmd(config) {
        const cmdFile = "python " + __dirname + "/../shadowsocks/shadowsocks/local.py"
        const localPort = configManager.getLocalPort();
        const args = `-s ${config.server} -p ${config.server_port} -m ${config.method} -k ${config.password} -l ${localPort}`
        const result = `${cmdFile} ${args}`
        return result;
    }
    const cmd = getCmd(config)
    return runCmd(cmd, "shadowsocks")
}

function stop(handler) {
    handler()
}

let httpServer;
function startHttpServer() {
    if (httpServer) {
        return Promise.resolve();
    }

    const cmd = "/usr/local/bin/polipo socksParentProxy=localhost:" + configManager.getLocalPort() +
            " proxyPort=" + configManager.getHttpPort();
    return runCmd(cmd, "polipo").then(function(handler) {
        httpServer = handler;
        return handler;
    });
}
function stopHttpServer() {
    httpServer && httpServer();
    httpServer = null;
}

let handler;
function quitSS() {
    handler && handler();
    handler = null;
}
function run(config) {
    quitSS();

    config = config || configManager.getCurrentServer();
    if (!config) {
        return error("no server available");
    }
    info("running with config:" + config.server);
    return start(config).then(stopHandler => {
        handler = stopHandler;
        return startHttpServer();
    })
}
function quit() {
    quitSS();
    stopHttpServer();
}

const Agent = require("socks5-http-client/lib/Agent");
const isConnected = (url, socksPort, timeout = 1000) => new Promise((resolve, reject) => {
    const params = {
        url,
        timeout
    };
    if (socksPort) {
        params.agentClass = Agent;
        params.agentOptions = {
            socksPort: socksPort
        }
    }
    const request = require('request');
    request(params, function (err, response, body) {
        const result = !err && response.statusCode == 200;
        log.d("request", url, socksPort, result);
        if (result) resolve(result);
        else reject(err);
    });
});

function isServerConnectable(server) {
    const proxy = configManager.getLocalPort();
    const url = 'http://www.google.com';
    return run(server).then(() => isConnected(url, proxy));
}

function generateSequence(count, start) {
    if (start >= count || start < 0) start = 0;
    const result = [];
    for (let i = 0; i < count; ++i) {
        result.push(i + start);
    }
    return result.map(n => n % count);
}

let isScanning = false;
function autoscan() {
    return new Promise((resolve, reject) => {
        const servers = configManager.getServers();
        const currentIndex = configManager.getCurrentServer().index;
        const sequence = generateSequence(servers.length, currentIndex);
        const async = require('async')
        isScanning = true;
        async.detectSeries(sequence, (index, callback) => {
            const server = servers[index];
            log.i("checking", index, server.server);
            isServerConnectable(server).then(
                () => callback(null, true),
                () => callback(null, false)
            );
        }, (err, result) => {
            isScanning = false;
            if (err) {
                reject(err);
            } else {
                resolve(result);
                configManager.setCurrentServerIndex(result);
            }
        });
    });
}
function autosetServer() {
    debug("autosetServer start");
    return isConnected("http://www.baidu.com").then(() => {
        return autoscan();
    });
}

module.exports = {
    run,
    quit,
    autosetServer,
}
