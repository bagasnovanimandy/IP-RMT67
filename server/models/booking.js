"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.User);
      Booking.belongsTo(models.Vehicle);
    }
  }
  Booking.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "UserId required" } },
      },
      VehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "VehicleId required" } },
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Start date required" } },
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "End date required" } },
      },
      totalPrice: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "PENDING",
      },
    },
    {
      sequelize,
      modelName: "Booking",
    }
  );
  return Booking;
};
