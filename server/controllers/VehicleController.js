const { Vehicle, Branch } = require("../models");

class VehicleController {
  //! GET /api/vehicles
  static async list(req, res, next) {
    try {
      const vehicles = await Vehicle.findAll({
        include: {
          model: Branch,
          attributes: ["id", "name", "city"],
        },
        order: [["id", "ASC"]],
      });

      res.status(200).json(vehicles);
    } catch (err) {
      console.log(err, "<-- VehicleController.list error");
      next(err);
    }
  }

  //! GET /api/vehicles/:id
  static async detail(req, res, next) {
    try {
      const { id } = req.params;

      const vehicle = await Vehicle.findByPk(id, {
        include: {
          model: Branch,
          attributes: ["id", "name", "city", "address"],
        },
      });

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle not found",
        });
      }

      res.status(200).json(vehicle);
    } catch (err) {
      console.log(err, "<-- VehicleController.detail error");
      next(err);
    }
  }
}

module.exports = VehicleController;
