const { Booking, Vehicle, User } = require("../models");

class BookingController {
  //! POST /api/bookings
  static async create(req, res, next) {
    try {
      const { VehicleId, startDate, endDate } = req.body;
      const { id: UserId } = req.user;

      if (!VehicleId || !startDate || !endDate)
        return res
          .status(400)
          .json({ message: "VehicleId, startDate, endDate wajib diisi" });

      const vehicle = await Vehicle.findByPk(VehicleId);
      if (!vehicle)
        return res.status(404).json({ message: "Vehicle not found" });

      const diffDays =
        (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      if (diffDays < 1)
        return res.status(400).json({ message: "Durasi minimal 1 hari" });

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
      console.log("BookingController.create", err);
      next(err);
    }
  }

  //! GET /api/bookings/me
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
      console.log("BookingController.myBookings", err);
      next(err);
    }
  }
}

module.exports = BookingController;
