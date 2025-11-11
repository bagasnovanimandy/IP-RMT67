const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000; //! Sesuaikan port server-mu

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//! Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Galindo Car Rental API is up and running",
  });
});

//! 404 handler sederhana
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

//! Global error handler sederhana
app.use((err, req, res, next) => {
  console.log(err, "<-- Global Error Handler");
  res.status(500).json({
    message: "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
