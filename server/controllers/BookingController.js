const { Booking, Vehicle } = require("../models");

class BookingController {
  // POST /api/bookings  (customer)
  static async create(req, res, next) {
    try {
      const { VehicleId, startDate, endDate } = req.body;
      const { id: UserId } = req.user;

      // Validasi input
      if (!VehicleId || !startDate || !endDate) {
        return res
          .status(400)
          .json({ message: "VehicleId, startDate, endDate wajib diisi" });
      }

      // Pastikan VehicleId adalah number
      const vehicleId = parseInt(VehicleId, 10);
      if (isNaN(vehicleId) || vehicleId <= 0) {
        return res.status(400).json({ message: "VehicleId tidak valid" });
      }

      // Validasi format tanggal
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Format tanggal tidak valid" });
      }

      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found" });

      const days = (end - start) / (1000 * 60 * 60 * 24);
      if (days < 1)
        return res.status(400).json({ message: "Durasi minimal 1 hari" });

      const totalPrice = Math.round(days) * vehicle.dailyPrice;

      const booking = await Booking.create({
        UserId,
        VehicleId: vehicleId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: "PENDING",
      });

      res.status(201).json({ message: "Booking created", booking });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/bookings/me  (customer)
  static async myBookings(req, res, next) {
    try {
      const { id: UserId } = req.user;
      const rows = await Booking.findAll({
        where: { UserId },
        include: {
          model: Vehicle,
          attributes: ["name", "dailyPrice", "imgUrl"],
        },
        order: [["id", "DESC"]],
      });
      res.status(200).json(rows);
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/bookings/:id/cancel  (owner/admin)
  static async cancel(req, res, next) {
    try {
      const { booking } = req;
      if (booking.status !== "PENDING") {
        return res
          .status(400)
          .json({ message: "Hanya PENDING yang bisa dibatalkan" });
      }
      booking.status = "CANCELED";
      await booking.save();
      res.status(200).json({ message: "Booking dibatalkan", booking });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/bookings/:id  (owner/admin)
  static async destroy(req, res, next) {
    try {
      const { booking } = req;
      await booking.destroy();
      res.status(200).json({ message: "Booking deleted" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = BookingController;
