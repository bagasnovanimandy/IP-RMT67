const { Booking } = require("../models");

async function canManageBooking(req, res, next) {
  try {
    const { id } = req.params; // booking id
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // pemilik atau admin boleh
    if (booking.UserId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.booking = booking; // lempar ke next untuk dipakai
    next();
  } catch (err) {
    next(err);
  }
}

async function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

module.exports = { canManageBooking, adminOnly };
