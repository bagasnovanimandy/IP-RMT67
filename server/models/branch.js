"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Branch extends Model {
    static associate(models) {
      Branch.hasMany(models.Vehicle, {
        foreignKey: "BranchId",
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      });
    }
  }

  Branch.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      latitude: {
        type: DataTypes.FLOAT,
      },
      longitude: {
        type: DataTypes.FLOAT,
      },
      phoneNumber: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Branch",
      tableName: "Branches",
    }
  );

  return Branch;
};
