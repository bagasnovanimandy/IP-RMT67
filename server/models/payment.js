"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Booking, {
        foreignKey: "BookingId",
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  }
  Payment.init(
    {
      BookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "BookingId required" } },
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      paymentType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      grossAmount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0 },
      },
      transactionStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      fraudStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      snapToken: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      redirectUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );
  return Payment;
};

