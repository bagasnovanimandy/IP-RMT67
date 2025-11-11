const express = require("express");
const VehicleController = require("../controllers/VehicleController");

const router = express.Router();

//! Public routes
router.get("/vehicles", VehicleController.list); // GET /api/vehicles
router.get("/vehicles/:id", VehicleController.detail); // GET /api/vehicles/:id

//! Placeholder routes lain (auth, booking, dll) nanti di sini
// router.post("/register", UserController.register);
// router.post("/login", UserController.login);

module.exports = router;
