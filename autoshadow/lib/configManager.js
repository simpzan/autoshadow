"use strict";

const utils = require('./utils')
const log = utils.createLogger('configManager');
const error = log.e;
const warn = log.w;
const debug = log.d;
const info = log.i;

const fs = require('fs');
function getConfigFile() {
    const path = utils.getUserHome() + "/.autoshadow.json";
    return path;
}
function loadConfig() {
    try {
        const fileContent = fs.readFileSync(getConfigFile());
        return JSON.parse(fileContent);
    } catch(e) {
        warn("faile to load config file: " + e);
        return {
            servers: []
        }
    }
}
function saveConfig() {
    fs.writeFileSync(getConfigFile(), JSON.stringify(config));
}

const config = loadConfig();

function importServers(file) {
    const json = require(file);
    const servers = json.configs;
    const newServers = servers.filter(function(config, index) {
        return isNewServer(config)
    });
    info("new servers", newServers.length)
    config.servers = config.servers.concat(newServers);
    config.currentIndex = config.currentIndex || 0;
    event.emit("updated")
    saveConfig();

    function isNewServer(server) {
        return config.servers.every(function(config) {
            return !(server.server === config.server && server.server_port === config.server_port);
        })
    }
}

function getServers() {
    return config.servers || [];
}
function getCurrentServer() {
    if (!config.servers || config.servers.length < 1) {
        return null;
    }
    const server = config.servers[config.currentIndex];
    server.index = config.currentIndex;
    return server;
}

function setCurrentServerIndex(index) {
    if (index < 0 || index >= config.servers.length) {
        return error("failed to set current index, invalid index: " + index);
    }
    config.currentIndex = index;
    event.emit("updated");
    saveConfig();
}

function getLocalPort() {
    return 1080;
}
function getHttpPort() {
    return 1081;
}

const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter();
function onConfigUpdated(fn) {
    event.on("updated", fn);
}

module.exports = {
    onConfigUpdated,
    getServers,
    getCurrentServer,
    setCurrentServerIndex,
    getLocalPort,
    getHttpPort,
    importServers
}
