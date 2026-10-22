// Local dev server (no dependencies). Run: node server.js  ->  http://localhost:3000
const http = require("http"), fs = require("fs"), path = require("path");
try {
  fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !l.trim().startsWith("#")) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch (e) { console.log("No .env file found. Copy .env.example to .env first."); }
const routes = { "/api/hc-login": "hc-login", "/api/hc-callback": "hc-callback", "/api/me": "me", "/api/logout": "logout", "/api/ht-login": "ht-login", "/api/ht-callback": "ht-callback", "/api/dashboard": "dashboard" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost:3000");
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (s) => res.end(s);
  res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
  res.redirect = (c, url) => { res.writeHead(c, { Location: url }); res.end(); };
  if (routes[u.pathname]) {
    req.query = Object.fromEntries(u.searchParams);
    try { return await require("./api/" + routes[u.pathname])(req, res); }
    catch (e) { console.error(e); return res.status(500).send("Server error"); }
  }
  if (u.pathname === "/" || u.pathname === "/index.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(fs.readFileSync(path.join(__dirname, "index.html")));
  }
  const pages = { "/dashboard.html": ["dashboard.html", "text/html; charset=utf-8"], "/config.js": ["config.js", "application/javascript"] };
  if (pages[u.pathname]) {
    res.setHeader("Content-Type", pages[u.pathname][1]);
    return res.end(fs.readFileSync(path.join(__dirname, pages[u.pathname][0])));
  }
  res.status(404).send("Not found");
}).listen(3000, () => console.log("Open http://localhost:3000"));
