const { neon } = require("@neondatabase/serverless");
const { requireAdmin } = require("./_admin");

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
};

const fields = (member) => ({
  id: member.id,
  name: member.name,
  role: member.role,
  initials: member.initials,
  accent: member.accent,
  sortOrder: member.sort_order,
});

const body = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
};

const validate = (input) => {
  const name = String(input.name || "").trim();
  const role = String(input.role || "").trim();
  const initials = String(input.initials || "").trim().toUpperCase();
  const accent = String(input.accent || "#ec3750").trim();
  const sortOrder = Number(input.sortOrder || 0);
  if (!name || !role || !/^[A-Z0-9]{1,3}$/.test(initials)) return null;
  if (name.length > 100 || role.length > 160 || !/^#[0-9a-f]{6}$/i.test(accent) || !Number.isInteger(sortOrder) || sortOrder < 0) return null;
  return { name, role, initials, accent, sortOrder };
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const query = sql();
    await query`CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(160) NOT NULL,
      initials VARCHAR(3) NOT NULL,
      accent VARCHAR(7) NOT NULL DEFAULT '#ec3750',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const count = await query`SELECT COUNT(*)::int AS count FROM team_members`;
    if (count[0].count === 0) {
      await query`INSERT INTO team_members (name, role, initials, accent, sort_order) VALUES
        ('Shaswat Kumar', 'Founder & Club Lead', 'SK', '#ec3750', 1),
        ('Manan Singla', 'Co-founder & Junior Prefect, Class 8', 'MS', '#a633d6', 2),
        ('Himank Gupta', 'Senior Prefect, Class 12', 'HG', '#338eda', 3),
        ('Pushkar', 'Senior Prefect, Class 12', 'P', '#ff8c37', 4),
        ('Ms. Priyanka Jain', 'Faculty Advisor', 'PJ', '#33a37a', 5),
        ('Ms. Priyanka Negi', 'Head of Department, IT', 'PN', '#1f2d3d', 6)`;
    }
    if (req.method === "GET") {
      const rows = await query`SELECT id, name, role, initials, accent, sort_order FROM team_members ORDER BY sort_order ASC, id ASC`;
      return res.json(rows.map(fields));
    }
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const values = validate(await body(req));
    if (!values) return res.status(400).json({ error: "invalid_team_member" });
    if (req.method === "POST") {
      const rows = await query`INSERT INTO team_members (name, role, initials, accent, sort_order) VALUES (${values.name}, ${values.role}, ${values.initials}, ${values.accent}, ${values.sortOrder}) RETURNING id, name, role, initials, accent, sort_order`;
      return res.status(201).json(fields(rows[0]));
    }
    const id = Number(req.query.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "invalid_team_member_id" });
    if (req.method === "PUT" || req.method === "PATCH") {
      const rows = await query`UPDATE team_members SET name = ${values.name}, role = ${values.role}, initials = ${values.initials}, accent = ${values.accent}, sort_order = ${values.sortOrder}, updated_at = NOW() WHERE id = ${id} RETURNING id, name, role, initials, accent, sort_order`;
      if (!rows.length) return res.status(404).json({ error: "team_member_not_found" });
      return res.json(fields(rows[0]));
    }
    if (req.method === "DELETE") {
      const rows = await query`DELETE FROM team_members WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "team_member_not_found" });
      return res.status(204).send("");
    }
    res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("[team]", error);
    return res.status(500).json({ error: "team_unavailable" });
  }
};
