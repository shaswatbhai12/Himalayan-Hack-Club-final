const { sign, cookie, flags } = require("./_session");
module.exports = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== cookie(req, "hc_state")) return res.status(400).send("Login failed: invalid state. Please try again.");
    const tr = await fetch("https://auth.hackclub.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.HC_CLIENT_ID || "bc7a26bb94e6c592769d5a40fe80a518",
        client_secret: process.env.HC_CLIENT_SECRET,
        redirect_uri: process.env.HC_REDIRECT_URI || "https://www.himalayanhackclub.xyz/api/hc-callback",
        code,
        grant_type: "authorization_code",
      }),
    });
    const tok = await tr.json();
    if (!tok.access_token) return res.status(401).send("Login failed: could not get a token. Check HC_CLIENT_SECRET and the redirect URI.");
    const ur = await fetch("https://auth.hackclub.com/oauth/userinfo", { headers: { Authorization: "Bearer " + tok.access_token } });
    const u = await ur.json();
    console.log("[hc userinfo fields]", Object.keys(u).join(", "));
    const full = u.name || [u.given_name, u.family_name].filter(Boolean).join(" ") || u.nickname || u.preferred_username || "";
    const session = sign({ name: full || (u.email ? u.email.split("@")[0] : "Member"), email: u.email || "", sub: u.sub || "" });
    res.setHeader("Set-Cookie", [
      `hc_session=${session}; ${flags}; Max-Age=604800`,
      `hc_state=; ${flags}; Max-Age=0`,
    ]);
    res.redirect(302, "/");
  } catch (e) { res.status(500).send("Login error. Please try again."); }
};
