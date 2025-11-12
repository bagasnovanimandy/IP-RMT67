const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");
const BookingController = require("../controllers/BookingController");
const authentication = require("../middleware/authentication");
const { canManageBooking, adminOnly } = require("../middleware/authorization");

const router = express.Router();

// Auth
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// Public
router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

// Protected
router.use(authentication);
router.post("/bookings", BookingController.create);
router.get("/bookings/me", BookingController.myBookings);

// Cancel (owner atau admin)
router.patch(
  "/bookings/:id/cancel",
  canManageBooking,
  BookingController.cancel
);

// Admin ubah status booking bebas
router.patch("/bookings/:id/status", adminOnly, BookingController.updateStatus);

module.exports = router;
