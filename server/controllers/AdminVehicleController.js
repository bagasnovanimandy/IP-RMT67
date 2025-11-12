const { Vehicle, Branch } = require("../models");
const { Op } = require("sequelize");

class AdminVehicleController {
  // GET /api/admin/vehicles?q=&page=&limit=
  static async list(req, res, next) {
    try {
      const { q = "", page = "1", limit = "10" } = req.query;
      const _page = Math.max(1, parseInt(page) || 1);
      const _limit = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const offset = (_page - 1) * _limit;

      const where = {};
      if (q) {
        const term = `%${q}%`;
        where[Op.or] = [
          { name: { [Op.iLike]: term } },
          { brand: { [Op.iLike]: term } },
          { type: { [Op.iLike]: term } },
          { plateNumber: { [Op.iLike]: term } },
        ];
      }

      const { rows, count } = await Vehicle.findAndCountAll({
        where,
        include: [{ model: Branch, attributes: ["id", "name", "city"] }],
        order: [["id", "DESC"]],
        limit: _limit,
        offset,
      });

      res.status(200).json({
        data: rows,
        meta: {
          page: _page,
          limit: _limit,
          total: count,
          totalPages: Math.max(1, Math.ceil(count / _limit)),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/admin/vehicles
  static async create(req, res, next) {
    try {
      const payload = req.body;
      const v = await Vehicle.create(payload);
      res.status(201).json({ message: "Vehicle created", vehicle: v });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/admin/vehicles/:id
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const v = await Vehicle.findByPk(id);
      if (!v) return res.status(404).json({ message: "Vehicle not found" });
      await v.update(payload);
      res.status(200).json({ message: "Vehicle updated", vehicle: v });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/admin/vehicles/:id
  static async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const v = await Vehicle.findByPk(id);
      if (!v) return res.status(404).json({ message: "Vehicle not found" });
      await v.destroy();
      res.status(200).json({ message: "Vehicle deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminVehicleController;
