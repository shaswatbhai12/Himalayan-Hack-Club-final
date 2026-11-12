const { verify, cookie, dec } = require("./_session");
const BASE = "https://hackatime.hackclub.com/api/v1/authenticated";
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!verify(cookie(req, "hc_session"))) return res.status(401).json({ error: "not_logged_in" });
  const token = dec(cookie(req, "ht_token"));
  if (!token) return res.json({ connected: false });
  const get = async (p) => {
    try {
      const r = await fetch(BASE + p, { headers: { Authorization: "Bearer " + token } });
      const t = await r.text();
      let d = null; try { d = JSON.parse(t); } catch (e) {}
      console.log("[hackatime]", p, r.status);
      return { status: r.status, d };
    } catch (e) { console.log("[hackatime]", p, "failed:", e.message); return { status: 0, d: null }; }
  };
  const [all, week, streak, proj] = await Promise.all([
    get("/hours?start_date=2015-01-01"), get("/hours"), get("/streak"), get("/projects"),
  ]);
  const st = [all, week, streak, proj].map((x) => x.status);
  if (st.every((s) => s === 401)) {
    const me = await get("/me");
    if (me.status === 200) {
      const level = me.d && me.d.trust_factor && me.d.trust_factor.trust_level;
      console.log("[hackatime] trust level:", level || "unknown");
      return res.json({ connected: false, trust: level || null, message: "Hackatime accepted your login and gave the 'read' permission, but it refuses to share coding stats for this account" + (level ? " (its trust level is '" + level + "')" : "") + ". This usually means the account is restricted or banned. Please DM the Fraud Squad on Slack for help:", helpUrl: "https://hackclub.slack.com/team/U091HC53CE8" });
    }
    return res.json({ connected: false, message: "Hackatime rejected this account's access. The connection may have been revoked, or the Hackatime account may be restricted or banned. Please DM the Fraud Squad on Slack for help:", helpUrl: "https://hackclub.slack.com/team/U091HC53CE8" });
  }
  if (st.some((s) => s === 401 || s === 403))
    return res.json({ connected: false, message: "Hackatime refused access to your coding data (permission problem). In your Hackatime app make sure the 'read' scope is ticked, then connect again." });
  if (st.every((s) => s === 0 || s >= 500))
    return res.json({ connected: false, message: "Could not reach Hackatime right now. Please try again in a minute." });
  const month = Date.now() - 30 * 864e5;
  const projects = ((proj.d && proj.d.projects) || []).filter((p) => !p.archived).map((p) => ({
    name: p.name, seconds: p.total_seconds || 0, languages: (p.languages || []).slice(0, 4),
    last: p.most_recent_heartbeat || null,
    active: !!p.most_recent_heartbeat && new Date(p.most_recent_heartbeat).getTime() > month,
  })).sort((a, b) => (b.last || "").localeCompare(a.last || ""));
  res.json({
    connected: true,
    totalSeconds: (all.d && all.d.total_seconds) || 0,
    weekSeconds: (week.d && week.d.total_seconds) || 0,
    streak: (streak.d && streak.d.streak_days) || 0,
    projects, activeCount: projects.filter((p) => p.active).length,
  });
};
