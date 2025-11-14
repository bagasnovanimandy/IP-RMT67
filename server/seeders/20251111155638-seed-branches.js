"use strict";
const fs = require("fs");
const path = require("path");

module.exports = {
  async up(queryInterface, Sequelize) {
    const data = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../data/branches.json"), "utf-8")
    );
    await queryInterface.bulkInsert("Branches", data, {});
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Branches", null, {});
  },
};
