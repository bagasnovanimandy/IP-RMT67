require("dotenv").config();

const express = require("express");
const cors = require("cors");
const router = require("./routes"); // routes/index.js
const errorHandler = require("./middleware/errorHandler");
const aiRouter = require("./routes/ai");

const app = express();

// Middlewares
// CORS configuration - allow Firebase domains and local development
const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "https://galindo-client.web.app, https://galindo-client.firebaseapp.com, https://galindojmtransport-f87dc.web.app, https://galindojmtransport-f87dc.firebaseapp.com, http://localhost:5173, http://localhost:3000, https://bagas14258.duckdns.org"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow any Firebase hosting domain (*.web.app or *.firebaseapp.com)
      if (
        origin.includes(".web.app") ||
        origin.includes(".firebaseapp.com" || origin.includes(".duckdns.org"))
      ) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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
