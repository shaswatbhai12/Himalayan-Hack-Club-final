const { flags } = require("./_session");
module.exports = (req, res) => {
  res.setHeader("Set-Cookie", `hc_session=; ${flags}; Max-Age=0`);
  res.redirect(302, "/");
};
