require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./routes"); // routes/index.js
const errorHandler = require("./middleware/errorHandler");
const aiRouter = require("./routes/ai");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "galindo-car-rental" });
});

// API routes
app.use("/api", router);
app.use("/api/ai", aiRouter);

// 404 fallback (jika tidak ada route yang cocok)
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Centralized error handler (harus di akhir)
app.use(errorHandler);

module.exports = app;
