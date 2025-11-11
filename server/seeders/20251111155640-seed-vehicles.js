"use strict";
const fs = require("fs");
const path = require("path");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const filePath = path.join(__dirname, "../data/vehicles.json");
    const file = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(file);

    await queryInterface.bulkInsert("Vehicles", data, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Vehicles", null, {});
  },
};
