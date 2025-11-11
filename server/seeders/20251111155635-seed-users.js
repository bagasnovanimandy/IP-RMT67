"use strict";
const fs = require("fs");
const path = require("path");

module.exports = {
  async up(queryInterface, Sequelize) {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/users.json"), "utf-8")
    );
    await queryInterface.bulkInsert("Users", data, {});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
