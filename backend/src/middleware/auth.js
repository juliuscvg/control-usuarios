const { verifyToken } = require("../utils/jwt");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    req.user = verifyToken(token); // { sub, email, role }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid/expired token" });
  }
};
