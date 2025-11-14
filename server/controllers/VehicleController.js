const { Op } = require("sequelize");
const { Vehicle, Branch } = require("../models");

class VehicleController {
  // GET /api/vehicles?q=&city=&min=&max=&sort=&order=&page=&limit=
  static async list(req, res, next) {
    try {
      const {
        q = "",
        city = "",
        min = "",
        max = "",
        sort = "createdAt",
        order = "DESC",
        page = "1",
        limit = "9",
      } = req.query;

      const _page = Math.max(1, parseInt(page) || 1);
      const _limit = Math.min(24, Math.max(1, parseInt(limit) || 9));
      const offset = (_page - 1) * _limit;

      const where = {};
      if (min || max) {
        const _min = Number.isFinite(+min) ? +min : 0;
        const _max = Number.isFinite(+max) ? +max : undefined;
        where.dailyPrice = _max
          ? { [Op.between]: [_min, _max] }
          : { [Op.gte]: _min };
      }

      if (q) {
        const term = `%${q}%`;
        where[Op.or] = [
          { name: { [Op.iLike]: term } },
          { brand: { [Op.iLike]: term } },
          { type: { [Op.iLike]: term } },
          { plateNumber: { [Op.iLike]: term } },
        ];
      }

      const include = [
        {
          model: Branch,
          required: false,
          where: city ? { city } : undefined,
          attributes: ["id", "name", "city", "address"],
        },
      ];

      const sortable = new Set(["createdAt", "dailyPrice", "year", "name"]);
      const sortKey = sortable.has(String(sort)) ? String(sort) : "createdAt";
      const sortOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

      const { rows, count } = await Vehicle.findAndCountAll({
        where,
        include,
        order: [[sortKey, sortOrder]],
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
          sort: sortKey,
          order: sortOrder,
          q,
          city,
          min,
          max,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/vehicles/:id
  static async detail(req, res, next) {
    try {
      const { id } = req.params;
      const found = await Vehicle.findByPk(id, {
        include: [
          { model: Branch, attributes: ["id", "name", "city", "address"] },
        ],
      });
      if (!found) return res.status(404).json({ message: "Vehicle not found" });
      res.status(200).json(found);
    } catch (err) {
      next(err);
    }
  }

  // GET /api/branches
  static async listBranches(req, res, next) {
    try {
      const branches = await Branch.findAll({
        attributes: ["id", "name", "city", "address"],
        order: [["city", "ASC"], ["name", "ASC"]],
      });
      res.status(200).json(branches);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = VehicleController;
