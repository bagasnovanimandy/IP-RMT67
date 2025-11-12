const express = require("express");
const VehicleController = require("../controllers/VehicleController");
const UserController = require("../controllers/UserController");

const router = express.Router();

// Auth
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/google-login", UserController.googleLogin); // <-- baru

// Public Vehicles
router.get("/vehicles", VehicleController.list);
router.get("/vehicles/:id", VehicleController.detail);

module.exports = router;
