// middleware/authentication.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const SECRET = process.env.JWT_SECRET || "secret-galindo";

module.exports = async function authentication(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const payload = jwt.verify(token, SECRET);
    const user = await User.findByPk(payload.id, {
      attributes: ["id", "email", "role", "fullName"],
    });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    next();
  } catch (err) {
    next(err);
  }
};
