const { verify, cookie, dec } = require("./_session");
const BASE = "https://hackatime.hackclub.com/api/v1/authenticated";
module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!verify(cookie(req, "hc_session"))) return res.status(401).json({ error: "not_logged_in" });
  const token = dec(cookie(req, "ht_token"));
  if (!token) return res.json({ connected: false });
  const get = async (p) => {
    const r = await fetch(BASE + p, { headers: { Authorization: "Bearer " + token } });
    if (r.status === 401 || r.status === 403) throw new Error("auth");
    return r.json();
  };
  try {
    const [all, week, streak, proj] = await Promise.all([
      get("/hours?start_date=2015-01-01"), get("/hours"), get("/streak"), get("/projects"),
    ]);
    const month = Date.now() - 30 * 864e5;
    const projects = (proj.projects || []).filter((p) => !p.archived).map((p) => ({
      name: p.name, seconds: p.total_seconds || 0, languages: (p.languages || []).slice(0, 4),
      last: p.most_recent_heartbeat || null,
      active: !!p.most_recent_heartbeat && new Date(p.most_recent_heartbeat).getTime() > month,
    })).sort((a, b) => (b.last || "").localeCompare(a.last || ""));
    res.json({ connected: true, totalSeconds: all.total_seconds || 0, weekSeconds: week.total_seconds || 0,
      streak: streak.streak_days || 0, projects, activeCount: projects.filter((p) => p.active).length });
  } catch (e) {
    res.json({ connected: false, expired: true });
  }
};
