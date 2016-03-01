"use strict";

const electron = require('electron');
const Menu = electron.Menu;
const notifier = require('node-notifier');

const prefix = 'menu'
const error = console.error.bind(null, prefix)
const info = console.info.bind(null, prefix)
const debug = console.log.bind(null, prefix)

const autoshadow = require('autoshadow');
const configManager = autoshadow.configManager;

function autosetServer() {
    info("autosetServer");
    notifier.notify({
        title: "testing servers",
        message: "msg"
    });
    statusMenuItem.enabled = false
    var co = require('co');
    co(autoshadow.autosetServer).then(function() {
        info('autoconfig done');
        notifier.notify({
            title: "config done",
            message: configManager.getCurrentServer().server
        })
    }, function(err) {
        error(err)
        notifier.notify({
            title: "config failed",
            message: err
        })
    })
}

function manuallySetServer(server, index) {
    info("manuallySetServer with server: " + index + " : " + server.server)
    configManager.setCurrentServerIndex(index);
    autoshadow.run(server);
}

function importServers() {
    info("importServers")
    var dialog = require('dialog');
    dialog.showOpenDialog({
        properties: ['openFile']
    }, function(files) {
        if (!files) return;

        const file = files[0];
        info("selected file: " + file);
        configManager.importServers(files[0]);
        autoshadow.run();
    });
}

function exitApp() {
    electron.app.quit();
    autoshadow.quit();
}

function getServersMenu() {
    const currentServer = configManager.getCurrentServer();

    const menuItems = configManager.getServers().map(function(server, index) {
        const isCurrentServer = index === currentServer.index;
        return {
            label: server.server,
            type: 'radio',
            checked: isCurrentServer,
            click: function() {
                manuallySetServer(server, index);
            }
        };
    });
    return menuItems;
}

let statusMenuItem = null;
function getMenus() {
    const server = configManager.getCurrentServer();
    const status = 'status: ' + (server ? server.server : "no server available");
    var menu = Menu.buildFromTemplate([{
        label: status
    }, {
        label: 'refresh',
        click: autosetServer,
        enabled: !!server
    }, {
        label: 'servers',
        type: 'submenu',
        submenu: getServersMenu()
    }, {
        label: 'import',
        click: importServers
    }, {
        label: 'exit',
        accelerator: 'Command+Q',
        click: exitApp
    }]);
    statusMenuItem = menu.items[0];
    return menu;
}

module.exports = {
    getMenus
};
