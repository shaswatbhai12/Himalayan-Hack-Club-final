const { neon } = require("@neondatabase/serverless");
const { requireAdmin } = require("./_admin");

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
};

const sponsorFields = (sponsor) => ({
  id: sponsor.id,
  name: sponsor.name,
  url: sponsor.url,
  description: sponsor.description,
  logoUrl: sponsor.logo_url,
  accent: sponsor.accent,
  sortOrder: sponsor.sort_order,
});

const body = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
};

const validate = (input) => {
  const name = String(input.name || "").trim();
  const url = String(input.url || "").trim();
  const description = String(input.description || "").trim();
  const logoUrl = String(input.logoUrl || "").trim();
  const accent = String(input.accent || "#ec3750").trim();
  const sortOrder = Number(input.sortOrder || 0);
  if (!name || !/^https?:\/\/\S+$/i.test(url)) return null;
  if (name.length > 100 || url.length > 500 || description.length > 200 || logoUrl.length > 500 || !/^#[0-9a-f]{6}$/i.test(accent) || !Number.isInteger(sortOrder)) return null;
  return { name, url, description, logoUrl, accent, sortOrder };
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const query = sql();
    if (req.method === "GET") {
      const rows = await query`SELECT id, name, url, description, logo_url, accent, sort_order FROM sponsors ORDER BY sort_order ASC, id ASC`;
      return res.json(rows.map(sponsorFields));
    }
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const values = validate(await body(req));
    if (!values) return res.status(400).json({ error: "invalid_sponsor" });

    if (req.method === "POST") {
      const rows = await query`INSERT INTO sponsors (name, url, description, logo_url, accent, sort_order) VALUES (${values.name}, ${values.url}, ${values.description}, ${values.logoUrl}, ${values.accent}, ${values.sortOrder}) RETURNING id, name, url, description, logo_url, accent, sort_order`;
      return res.status(201).json(sponsorFields(rows[0]));
    }
    const id = Number(req.query.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "invalid_sponsor_id" });
    if (req.method === "PUT" || req.method === "PATCH") {
      const rows = await query`UPDATE sponsors SET name = ${values.name}, url = ${values.url}, description = ${values.description}, logo_url = ${values.logoUrl}, accent = ${values.accent}, sort_order = ${values.sortOrder}, updated_at = NOW() WHERE id = ${id} RETURNING id, name, url, description, logo_url, accent, sort_order`;
      if (!rows.length) return res.status(404).json({ error: "sponsor_not_found" });
      return res.json(sponsorFields(rows[0]));
    }
    if (req.method === "DELETE") {
      const rows = await query`DELETE FROM sponsors WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "sponsor_not_found" });
      return res.status(204).send("");
    }
    res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("[sponsors]", error);
    return res.status(500).json({ error: "sponsors_unavailable" });
  }
};
