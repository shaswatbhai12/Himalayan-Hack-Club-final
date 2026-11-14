const crypto = require("crypto");
const secret = () => process.env.SESSION_SECRET || "";
const b64 = (s) => Buffer.from(s).toString("base64url");
exports.sign = (obj) => {
  const body = b64(JSON.stringify({ ...obj, exp: Date.now() + 7 * 864e5 }));
  const sig = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + sig;
};
exports.verify = (tok) => {
  if (!tok || !secret()) return null;
  const [body, sig] = tok.split(".");
  const good = crypto.createHmac("sha256", secret()).update(body || "").digest("base64url");
  if (!sig || sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const d = JSON.parse(Buffer.from(body, "base64url").toString()); return d.exp > Date.now() ? d : null; } catch { return null; }
};
exports.cookie = (req, name) => ((req.headers.cookie || "").split("; ").find((c) => c.startsWith(name + "=")) || "").slice(name.length + 1);

exports.flags = process.env.VERCEL ? "HttpOnly; Secure; SameSite=Lax; Path=/" : "HttpOnly; SameSite=Lax; Path=/";
const key = () => crypto.createHash("sha256").update(secret()).digest();
exports.enc = (t) => {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const e = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), e]).toString("base64url");
};
exports.dec = (s) => {
  try {
    const b = Buffer.from(s, "base64url"), d = crypto.createDecipheriv("aes-256-gcm", key(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch { return null; }
};
