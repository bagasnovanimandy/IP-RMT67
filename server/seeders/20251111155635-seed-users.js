"use strict";
const fs = require("fs");
const path = require("path");
const { hashPassword } = require("../helpers/bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const filePath = path.join(__dirname, "../data/users.json");
    const file = fs.readFileSync(filePath, "utf-8");
    const users = JSON.parse(file);

    //! Hash password dari JSON sebelum diinsert
    const hashedUsers = users.map((user) => {
      user.password = hashPassword(user.password);
      return user;
    });

    await queryInterface.bulkInsert("Users", hashedUsers, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
