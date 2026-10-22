const { verify, cookie, flags, enc } = require("./_session");
module.exports = async (req, res) => {
  try {
    if (!verify(cookie(req, "hc_session"))) return res.redirect(302, "/");
    const { code, state } = req.query;
    if (!code || !state || state !== cookie(req, "ht_state")) return res.redirect(302, "/dashboard.html?ht=error");
    const tr = await fetch("https://hackatime.hackclub.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.HT_CLIENT_ID || "",
        client_secret: process.env.HT_CLIENT_SECRET || "",
        redirect_uri: process.env.HT_REDIRECT_URI || "https://himalayan-hack-club2.vercel.app/api/ht-callback",
        code,
        grant_type: "authorization_code",
      }),
    });
    const tok = await tr.json();
    console.log("[hackatime token] got token:", !!tok.access_token, "scope:", tok.scope, "error:", tok.error || "-");
    if (!tok.access_token) return res.redirect(302, "/dashboard.html?ht=error");
    res.setHeader("Set-Cookie", [`ht_token=${enc(tok.access_token)}; ${flags}; Max-Age=31536000`, `ht_state=; ${flags}; Max-Age=0`]);
    res.redirect(302, "/dashboard.html?ht=ok");
  } catch (e) { res.redirect(302, "/dashboard.html?ht=error"); }
};
