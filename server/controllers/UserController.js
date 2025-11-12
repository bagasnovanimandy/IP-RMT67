// controllers/UserController.js
const { User } = require("../models");
const { comparePassword } = require("../helpers/bcrypt");
const { signToken } = require("../helpers/jwt");

class UserController {
  //! POST /api/register
  static async register(req, res, next) {
    try {
      const { name, email, password, phoneNumber } = req.body;

      const user = await User.create({
        name,
        email,
        password,
        phoneNumber,
        role: "customer", //! register biasa selalu customer
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (err) {
      console.log(err, "<-- UserController.register error");
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

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          message: "Invalid email/password",
        });
      }

      const isValid = comparePassword(password, user.password);

      if (!isValid) {
        return res.status(401).json({
          message: "Invalid email/password",
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
        },
      });
    } catch (err) {
      console.log(err, "<-- UserController.login error");
      next(err);
    }
  }
}

module.exports = UserController;
