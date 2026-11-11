const { neon } = require("@neondatabase/serverless");
const { requireAdmin } = require("./_admin");

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
};

const eventFields = (event) => ({
  id: event.id,
  title: event.title,
  date: event.event_date,
  location: event.location,
  description: event.description,
  tag: event.tag,
});

const body = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString() || "{}");
};

const validate = (input) => {
  const title = String(input.title || "").trim();
  const date = String(input.date || "").trim();
  const location = String(input.location || "TBD").trim() || "TBD";
  const description = String(input.description || "").trim();
  const tag = String(input.tag || "Event").trim() || "Event";
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (title.length > 120 || location.length > 160 || description.length > 500 || tag.length > 40) return null;
  return { title, date, location, description, tag };
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const query = sql();
    if (req.method === "GET") {
      const rows = await query`SELECT id, title, event_date::text AS event_date, location, description, tag FROM events ORDER BY event_date ASC, id ASC`;
      return res.json(rows.map(eventFields));
    }
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const input = await body(req);
    const values = validate(input);
    if (!values) return res.status(400).json({ error: "invalid_event" });

    if (req.method === "POST") {
      const rows = await query`INSERT INTO events (title, event_date, location, description, tag) VALUES (${values.title}, ${values.date}, ${values.location}, ${values.description}, ${values.tag}) RETURNING id, title, event_date::text AS event_date, location, description, tag`;
      return res.status(201).json(eventFields(rows[0]));
    }
    const id = Number(req.query.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "invalid_event_id" });
    if (req.method === "PUT" || req.method === "PATCH") {
      const rows = await query`UPDATE events SET title = ${values.title}, event_date = ${values.date}, location = ${values.location}, description = ${values.description}, tag = ${values.tag}, updated_at = NOW() WHERE id = ${id} RETURNING id, title, event_date::text AS event_date, location, description, tag`;
      if (!rows.length) return res.status(404).json({ error: "event_not_found" });
      return res.json(eventFields(rows[0]));
    }
    if (req.method === "DELETE") {
      const rows = await query`DELETE FROM events WHERE id = ${id} RETURNING id`;
      if (!rows.length) return res.status(404).json({ error: "event_not_found" });
      return res.status(204).send("");
    }
    res.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("[events]", error);
    return res.status(500).json({ error: "events_unavailable" });
  }
};
