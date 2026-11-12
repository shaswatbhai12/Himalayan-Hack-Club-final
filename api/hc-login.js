const crypto = require("crypto");
const { flags } = require("./_session");
module.exports = (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const p = new URLSearchParams({
    client_id: process.env.HC_CLIENT_ID || "bc7a26bb94e6c592769d5a40fe80a518",
    redirect_uri: process.env.HC_REDIRECT_URI || "https://www.himalayanhackclub.xyz/api/hc-callback",
    response_type: "code",
    scope: process.env.HC_SCOPES || "openid name email",
    state,
  });
  res.setHeader("Set-Cookie", `hc_state=${state}; ${flags}; Max-Age=600`);
  res.redirect(302, "https://auth.hackclub.com/oauth/authorize?" + p);
};
