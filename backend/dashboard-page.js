const { serveStaticFile } = require("./_static");

module.exports = (req, res) => serveStaticFile("dashboard.html", "text/html; charset=utf-8", res);
