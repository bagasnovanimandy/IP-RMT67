const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");
//! const authentication = require("../middleware/authentication"); // nanti dipakai

const router = express.Router();

//! Auth routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);
//! router.post("/google-login", UserController.googleLogin); // nanti

//! Public Vehicle routes
router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

//! Protected routes (nanti): pakai authentication
// router.use(authentication);
// router.get("/bookings/me", BookingController.getMyBookings);

module.exports = router;
