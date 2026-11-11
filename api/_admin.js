const { createClerkClient, verifyToken } = require("@clerk/backend");

const domain = "@himalayanhackclub.xyz";

exports.requireAdmin = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || !process.env.CLERK_SECRET_KEY) {
    res.status(401).json({ error: "admin_auth_required" });
    return null;
  }
  try {
    const claims = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const user = await client.users.getUser(claims.sub);
    const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress || "";
    if (!email.toLowerCase().endsWith(domain)) {
      res.status(403).json({ error: "admin_forbidden" });
      return null;
    }
    return { id: user.id, email };
  } catch (error) {
    console.error("[admin auth]", error.message);
    res.status(401).json({ error: "admin_auth_invalid" });
    return null;
  }
};
