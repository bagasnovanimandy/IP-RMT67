"use strict";
const { Model } = require("sequelize");
const { hashPassword } = require("../helpers/bcrypt"); //! import helper

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      //! Nanti: User.hasMany(models.Booking)
      //! Nanti: User.hasMany(models.AiLog)
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Name is required" },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: "Email must be unique" },
        validate: {
          notEmpty: { msg: "Email is required" },
          isEmail: { msg: "Invalid email format" },
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Password is required" },
          len: {
            args: [5],
            msg: "Password minimum 5 characters",
          },
        },
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "customer",
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
      pictureUrl: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      hooks: {
        beforeCreate(user) {
          user.password = hashPassword(user.password);
        },

        beforeBulkCreate(users) {
          users.forEach((user) => {
            user.password = hashPassword(user.password);
          });
        },
      },
    }
  );

  return User;
};
