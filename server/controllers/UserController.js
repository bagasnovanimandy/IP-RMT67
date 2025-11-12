const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { GOOGLE_CLIENT_ID } = require("../config/thirdparty");

class UserController {
  //! POST /api/google-login
  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        return res.status(400).json({ message: "id_token is required" });
      }

      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload(); // email, name, picture, dsb.
      const email = payload?.email;
      const name = payload?.name || email?.split("@")[0] || "Google User";
      if (!email) {
        return res.status(400).json({ message: "Invalid Google token" });
      }

      // cari / buat user
      let user = await User.findOne({ where: { email } });
      if (!user) {
        user = await User.create({
          name,
          email,
          password: Math.random().toString(36).slice(-8),
          pictureUrl: payload?.picture || null,
          role: "customer",
        });
      }

      const access_token = signToken({ id: user.id });
      res.status(200).json({
        access_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          pictureUrl: user.pictureUrl,
        },
      });
    } catch (err) {
      console.log("googleLogin error:", err);
      next(err);
    }
  }
}

module.exports = UserController;
