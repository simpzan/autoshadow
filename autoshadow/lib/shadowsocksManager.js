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
            info(prefix, data.toString().trim());
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
        return new Promise(function(resolve, reject) {
            resolve()
        })
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
function *run(config) {
    quitSS();

    config = config || configManager.getCurrentServer();
    if (!config) {
        return error("no server available");
    }
    info("running with config:" + config.server);
    handler = yield start(config);
    return startHttpServer();
}
function quit() {
    quitSS();
    stopHttpServer();
}

function isConnectable() {
    const proxy = 'http://localhost:' + configManager.getHttpPort();
    const params = {
        'url':  'http://www.google.com',
        'timeout': 1000,
        'proxy': proxy
    };
    return new Promise(function(resolve, reject) {
        request(params, function (err, response, body) {
            const result = !err && response.statusCode == 200;
            resolve(result);
        });
    })
}
const request = require('request');

function *autosetServer() {
    debug("autosetServer start");
    const servers = configManager.getServers();
    const count = servers.length;
    const currentIndex = configManager.getCurrentServer().index;
    for(let i = currentIndex; i !== currentIndex - 1; i = (i + 1) % count) {
        const server = servers[i];
        info("server", i, server);
        yield server;
        yield run(server);
        const result = yield isConnectable();
        if (result) {
            configManager.setCurrentServerIndex(i);
            info("using server: " + server.server);
            return;
        }
    }
    debug("autosetServer done")
}

module.exports = {
    run,
    quit,
    autosetServer,
    isConnectable
}
