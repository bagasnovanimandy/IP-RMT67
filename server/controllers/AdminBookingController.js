const { Booking, Vehicle, User } = require("../models");

class AdminBookingController {
  // GET /api/admin/bookings?page=&limit=&status=
  static async listAll(req, res, next) {
    try {
      const { page = "1", limit = "10", status = "" } = req.query;
      const _page = Math.max(1, parseInt(page) || 1);
      const _limit = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const offset = (_page - 1) * _limit;

      const where = {};
      if (status) where.status = status;

      const { rows, count } = await Booking.findAndCountAll({
        where,
        include: [
          {
            model: Vehicle,
            attributes: ["id", "name", "dailyPrice", "imgUrl"],
          },
          { model: User, attributes: ["id", "email", "fullName", "role"] },
        ],
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

  // PATCH /api/admin/bookings/:id/status { status }
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const allowed = [
        "PENDING",
        "CONFIRMED",
        "COMPLETED",
        "REJECTED",
        "CANCELED",
      ];
      if (!allowed.includes(status))
        return res.status(400).json({ message: "Invalid status" });

      const booking = await Booking.findByPk(id);
      if (!booking)
        return res.status(404).json({ message: "Booking not found" });

      booking.status = status;
      await booking.save();

      res.status(200).json({ message: "Status updated", booking });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/admin/bookings/:id
  static async destroy(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await Booking.findByPk(id);
      if (!booking)
        return res.status(404).json({ message: "Booking not found" });
      await booking.destroy();
      res.status(200).json({ message: "Booking deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminBookingController;
