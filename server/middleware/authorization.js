const { Booking } = require("../models");

/**
 * Hanya pemilik booking atau admin yang boleh melanjutkan.
 * Mengisi req.booking jika ditemukan.
 */
async function canManageBooking(req, res, next) {
  try {
    const { id } = req.params; // booking id
    const booking = await Booking.findByPk(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.UserId === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.booking = booking;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Hanya admin yang boleh melanjutkan.
 */
function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
}

module.exports = { canManageBooking, adminOnly };
