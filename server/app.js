require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./routes"); // routes/index.js
const errorHandler = require("./middleware/errorHandler");
const aiRouter = require("./routes/ai");

const app = express();

// Middlewares
// CORS configuration - allow Firebase domains and local development
// Using explicit origin string to avoid "Multiple Origin Not Allowed" error
const allowedOrigins = [
  "https://galindo-client.web.app",
  "https://galindo-client.firebaseapp.com",
  "https://galindojmtransport-f87dc.web.app",
  "https://galindojmtransport-f87dc.firebaseapp.com",
  "http://localhost:5173", // Vite dev server
  "http://localhost:3000",
  "https://bagas14258.duckdns.org",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Allow any Firebase hosting domain (*.web.app or *.firebaseapp.com)
      if (origin.includes(".web.app") || origin.includes(".firebaseapp.com")) {
        return callback(null, true);
      }
      
      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    // Explicitly set options to prevent duplicate headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: [],
    maxAge: 86400, // 24 hours
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
