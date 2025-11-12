// routes/index.js
const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");
const BookingController = require("../controllers/BookingController");
const AdminBookingController = require("../controllers/AdminBookingController");
const AdminVehicleController = require("../controllers/AdminVehicleController");
const authentication = require("../middleware/authentication");
const { canManageBooking, adminOnly } = require("../middleware/authorization");
const { upload } = require("../middleware/upload");

const router = express.Router();

/** PUBLIC */
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/google-login", UserController.googleLogin);
router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

/** CUSTOMER */
router.use(authentication);
router.post("/bookings", BookingController.create);
router.get("/bookings/me", BookingController.myBookings);
router.patch(
  "/bookings/:id/cancel",
  canManageBooking,
  BookingController.cancel
);
router.delete("/bookings/:id", canManageBooking, BookingController.destroy);

/** ADMIN */
const admin = express.Router();
admin.use(authentication, adminOnly);

admin.get("/bookings", AdminBookingController.listAll);
admin.patch("/bookings/:id/status", AdminBookingController.updateStatus);
admin.delete("/bookings/:id", AdminBookingController.destroy);

admin.get("/vehicles", AdminVehicleController.list);
admin.post("/vehicles", AdminVehicleController.create);
admin.put("/vehicles/:id", AdminVehicleController.update);
admin.delete("/vehicles/:id", AdminVehicleController.destroy);

// NEW: upload image
admin.patch(
  "/vehicles/:id/image",
  upload.single("image"),
  AdminVehicleController.uploadImage
);

router.use("/admin", admin);

module.exports = router;
