const { Booking, Vehicle } = require("../models");

class BookingController {
  //! POST /api/bookings  (protected)
  static async create(req, res, next) {
    try {
      const { VehicleId, startDate, endDate } = req.body;
      const { id: UserId } = req.user;

      if (!VehicleId || !startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "VehicleId, startDate, endDate wajib diisi" });
      }

      const vehicle = await Vehicle.findByPk(VehicleId);
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found" });

      const diffDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        return res.status(400).json({ message: "Durasi minimal 1 hari" });
      }

      const totalPrice = Math.round(diffDays) * vehicle.dailyPrice;

      const newBooking = await Booking.create({
        UserId,
        VehicleId,
        startDate,
        endDate,
        totalPrice,
        status: "PENDING",
      });

      res.status(201).json({
        message: "Booking berhasil dibuat",
        booking: newBooking,
      });
    } catch (err) {
      next(err);
    }
  }

  //! GET /api/bookings/me  (protected)
  static async myBookings(req, res, next) {
    try {
      const { id: UserId } = req.user;
      const data = await Booking.findAll({
        where: { UserId },
        include: {
          model: Vehicle,
          attributes: ["name", "dailyPrice", "imgUrl"],
        },
        order: [["id", "DESC"]],
      });
      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  //! PATCH /api/bookings/:id/cancel  (owner/admin via canManageBooking)
  static async cancel(req, res, next) {
    try {
      const { booking } = req; // diisi middleware
      if (booking.status !== "PENDING") {
        return res.status(400).json({
          message: "Hanya booking dengan status PENDING yang dapat dibatalkan",
        });
      }
      booking.status = "CANCELED";
      await booking.save();
      res.status(200).json({ message: "Booking dibatalkan", booking });
    } catch (err) {
      next(err);
    }
  }

  //! PATCH /api/bookings/:id/status  (admin only)
  // body: { status: "PENDING" | "CONFIRMED" | "COMPLETED" | "REJECTED" | "CANCELED" }
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
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const booking = await Booking.findByPk(id);
      if (!booking)
        return res.status(404).json({ message: "Booking not found" });

      booking.status = status;
      await booking.save();
      res.status(200).json({ message: "Status diperbarui", booking });
    } catch (err) {
      next(err);
    }
  }

  //! DELETE /api/bookings/:id  (owner/admin via canManageBooking)
  static async destroy(req, res, next) {
    try {
      const { booking } = req; // diisi middleware
      await booking.destroy();
      res.status(200).json({ message: "Booking deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BookingController;
