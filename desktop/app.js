'use strict';

const electron = require('electron');
const app = electron.app;
const Tray = electron.Tray;
const BrowserWindow = electron.BrowserWindow;
const getMenus = require('./menus.js').getMenus;

const prefix = 'main'
const error = console.error.bind(null, prefix)
const debug = console.log.bind(null, prefix)
const info = console.info.bind(null, prefix)

const autoshadow = require('autoshadow');
const configManager = autoshadow.configManager;
const config = configManager.getCurrentServer();
if (config) {
    autoshadow.run(config);
}
configManager.event.on("updated", () => {
    updateMenu();
});

app.dock.hide()
app.on('ready', setupTray);

var appIcon = null;
function setupTray() {
    let image = __dirname + "/icon.png";
    appIcon = new Tray(image);
    appIcon.setToolTip('shadowsocks client manager');
    updateMenu();
}

function updateMenu() {
    appIcon.setContextMenu(getMenus());
}


// var mainWindow = null;
// function openWindow() {
//   mainWindow = new BrowserWindow({width: 800, height: 600});
//   mainWindow.loadURL('file://' + __dirname + '/index.html');
//   mainWindow.webContents.openDevTools();
//   mainWindow.on('closed', function() {
//     mainWindow = null;
//   });
// };
