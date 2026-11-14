const { verify, cookie } = require("./_session");
module.exports = (req, res) => {
  const s = verify(cookie(req, "hc_session"));
  res.setHeader("Cache-Control", "no-store");
  res.json(s ? { name: s.name, email: s.email } : {});
};
