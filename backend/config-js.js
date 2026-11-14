const { serveStaticFile } = require("./_static");

module.exports = (req, res) => serveStaticFile("config.js", "application/javascript; charset=utf-8", res);
