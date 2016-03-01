
const ss = require('./shadowsocksManager');

module.exports = {
    run: ss.run,
    quit: ss.quit,
    autosetServer: ss.autosetServer,
    configManager: require('./configManager')
}
