const { OAuth2Client } = require("google-auth-library");
const { User } = require("../models");
const { signToken } = require("../helpers/jwt");
const { comparePassword } = require("../helpers/bcrypt");
const { GOOGLE_CLIENT_ID } = require("../config/thirdparty");

class UserController {
  //! POST /api/register
  static async register(req, res, next) {
    try {
      const { name, email, password, phoneNumber } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email, and password are required",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already registered",
        });
      }

      // Create new user (password will be hashed by model hook)
      const user = await User.create({
        name,
        email,
        password,
        phoneNumber: phoneNumber || null,
        role: "customer",
      });

      // Generate access token
      const access_token = signToken({ id: user.id });

      res.status(201).json({
        access_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          pictureUrl: user.pictureUrl,
        },
      });
    } catch (err) {
      console.log("register error:", err);
      next(err);
    }
  }

  //! POST /api/login
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Compare password
      const isPasswordValid = comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Generate access token
      const access_token = signToken({ id: user.id });

      res.status(200).json({
        access_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          pictureUrl: user.pictureUrl,
        },
      });
    } catch (err) {
      console.log("login error:", err);
      next(err);
    }
  }

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
      } else {
        // Update pictureUrl dari Google jika ada (selalu update untuk memastikan foto terbaru)
        if (payload?.picture) {
          user.pictureUrl = payload.picture;
        }
        // Update name jika belum ada atau kosong
        if (!user.name && name) {
          user.name = name;
        }
        // Save jika ada perubahan
        if (payload?.picture || (!user.name && name)) {
          await user.save();
        }
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
