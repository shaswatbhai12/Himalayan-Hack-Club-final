const crypto = require("crypto");
const { verify, cookie, flags } = require("./_session");
module.exports = (req, res) => {
  if (!verify(cookie(req, "hc_session"))) return res.redirect(302, "/api/hc-login");
  const state = crypto.randomBytes(16).toString("hex");
  const p = new URLSearchParams({
    client_id: process.env.HT_CLIENT_ID || "",
    redirect_uri: process.env.HT_REDIRECT_URI || "https://www.himalayanhackclub.xyz/api/ht-callback",
    response_type: "code",
    scope: "profile read",
    state,
  });
  res.setHeader("Set-Cookie", `ht_state=${state}; ${flags}; Max-Age=600`);
  res.redirect(302, "https://hackatime.hackclub.com/oauth/authorize?" + p);
};
