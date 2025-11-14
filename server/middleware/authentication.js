// middleware/authentication.js
const { User } = require("../models");
const { verifyToken } = require("../helpers/jwt");

module.exports = async function authentication(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = verifyToken(token);
    const user = await User.findByPk(payload.id, {
      attributes: ["id", "email", "role", "name"],
    });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid token or token expired" });
    }
    next(err);
  }
};
