const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");
const BookingController = require("../controllers/BookingController");
const authentication = require("../middleware/authentication");
const { canManageBooking, adminOnly } = require("../middleware/authorization");

const router = express.Router();

// Auth (public)
router.post("/register", UserController.register);
router.post("/login", UserController.login);
// (Google login ditunda)

// Public
router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

// Protected
router.use(authentication);

// Bookings - create & list own
router.post("/bookings", BookingController.create);
router.get("/bookings/me", BookingController.myBookings);

// Bookings - cancel (owner/admin)
router.patch(
  "/bookings/:id/cancel",
  canManageBooking,
  BookingController.cancel
);

// Bookings - admin update status
router.patch("/bookings/:id/status", adminOnly, BookingController.updateStatus);

// Bookings - delete (owner/admin)
router.delete("/bookings/:id", canManageBooking, BookingController.destroy);

module.exports = router;
