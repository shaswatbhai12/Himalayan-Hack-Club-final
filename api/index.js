const express = require("express");

const app = express();
const handlers = {
  "/hc-login": require("../backend/hc-login"),
  "/hc-callback": require("../backend/hc-callback"),
  "/me": require("../backend/me"),
  "/logout": require("../backend/logout"),
  "/ht-login": require("../backend/ht-login"),
  "/ht-callback": require("../backend/ht-callback"),
  "/stats": require("../backend/stats"),
  "/events": require("../backend/events"),
  "/sponsors": require("../backend/sponsors"),
  "/team": require("../backend/team"),
  "/dashboard-page": require("../backend/dashboard-page"),
  "/manage-page": require("../backend/manage-page"),
  "/config-js": require("../backend/config-js"),
};

app.use(async (req, res) => {
  const path = req.path.replace(/^\/api(?=\/|$)/, "") || "/";
  const handler = handlers[path];
  if (!handler) return res.status(404).send("Not found");
  try {
    return await handler(req, res);
  } catch (error) {
    console.error("[api]", path, error);
    if (!res.headersSent) return res.status(500).json({ error: "server_error" });
  }
});

module.exports = app;
