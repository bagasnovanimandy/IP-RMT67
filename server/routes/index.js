// routes/index.js
const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");
const BookingController = require("../controllers/BookingController");
const AdminBookingController = require("../controllers/AdminBookingController");
const AdminVehicleController = require("../controllers/AdminVehicleController");

const authentication = require("../middleware/authentication");
const { canManageBooking, adminOnly } = require("../middleware/authorization");

const router = express.Router();

/** ========== PUBLIC ========== */
router.post("/register", UserController.register);
router.post("/login", UserController.login);

router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

/** ========== CUSTOMER (AUTH REQUIRED) ========== */
router.use(authentication);

router.post("/bookings", BookingController.create);
router.get("/bookings/me", BookingController.myBookings);
router.patch(
  "/bookings/:id/cancel",
  canManageBooking,
  BookingController.cancel
);
router.delete("/bookings/:id", canManageBooking, BookingController.destroy);

/** ========== ADMIN NAMESPACE ========== */
const admin = express.Router();
admin.use(authentication, adminOnly);

// Admin bookings
admin.get("/bookings", AdminBookingController.listAll);
admin.patch("/bookings/:id/status", AdminBookingController.updateStatus);
admin.delete("/bookings/:id", AdminBookingController.destroy);

// Admin vehicles (CRUD)
admin.get("/vehicles", AdminVehicleController.list);
admin.post("/vehicles", AdminVehicleController.create);
admin.put("/vehicles/:id", AdminVehicleController.update);
admin.delete("/vehicles/:id", AdminVehicleController.destroy);

router.use("/admin", admin);

module.exports = router;
