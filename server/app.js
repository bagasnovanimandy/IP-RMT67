require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./routes"); // routes/index.js
const errorHandler = require("./middleware/errorHandler");
const aiRouter = require("./routes/ai");

const app = express();

// Middlewares
// CORS configuration - allow Firebase domains and local development
app.use(
  cors({
    origin: [
      "https://galindo-client.web.app",
      "https://galindo-client.firebaseapp.com",
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000",
      "https://bagas14258.duckdns.org",
    ],
    credentials: true,
  })
);
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
