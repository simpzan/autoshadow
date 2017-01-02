const utils = require('./utils')
const log = utils.createLogger('isConnectable');

const Agent = require("socks5-http-client/lib/Agent");
const request = require('request');
const isConnectable = (url, socksPort, timeout = 1000) => new Promise((resolve, reject) => {
    const params = { url, timeout };
    if (socksPort) {
        params.agentClass = Agent;
        params.agentOptions = { socksPort }
    }
    request(params, (err, response, body) => {
        const result = !err && response.statusCode == 200;
        log.i("isConnectable", url, socksPort, result);
        if (result) resolve(result);
        else reject(err);
    });
});

module.exports = isConnectable;
