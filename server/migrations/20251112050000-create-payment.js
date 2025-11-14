"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      BookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Bookings", key: "id" },
        onDelete: "CASCADE",
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      paymentType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      grossAmount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      transactionStatus: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      fraudStatus: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      snapToken: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      redirectUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Payments");
  },
};

