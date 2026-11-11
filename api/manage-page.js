const { serveStaticFile } = require("./_static");

module.exports = (req, res) => serveStaticFile("manage.html", "text/html; charset=utf-8", res);
