const { verifyToken } = require("../helpers/jwt");
const { User } = require("../models");

async function authentication(req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid access token format" });
    }

    const payload = verifyToken(token); //! { id: ... }

    const user = await User.findByPk(payload.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    console.log(err, "<-- authentication error");
    return res.status(401).json({ message: "Invalid access token" });
  }
}

module.exports = authentication;
