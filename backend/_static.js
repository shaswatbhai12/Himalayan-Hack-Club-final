const fs = require("fs");
const path = require("path");

function serveStaticFile(fileName, contentType, res) {
  try {
    const file = fs.readFileSync(path.join(process.cwd(), fileName), "utf8");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.status(200).send(file);
  } catch (error) {
    console.error("[static-file]", fileName, error);
    return res.status(500).json({ error: "static_file_unavailable" });
  }
}

module.exports = { serveStaticFile };
