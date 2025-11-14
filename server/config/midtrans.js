const midtransClient = require("midtrans-client");

// Ensure dotenv is loaded (in case this module is loaded before app.js)
if (!process.env.MIDTRANS_SERVER_KEY) {
  require("dotenv").config();
}

// Load environment variables (trim whitespace)
const MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID?.trim();
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY?.trim();
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY?.trim();

// Validate required keys
if (!MERCHANT_ID || !CLIENT_KEY || !SERVER_KEY) {
  console.error(
    "⚠️  Midtrans keys not found in environment variables. Payment features will not work."
  );
  console.error("MERCHANT_ID:", MERCHANT_ID ? "✓" : "✗");
  console.error("CLIENT_KEY:", CLIENT_KEY ? "✓" : "✗");
  console.error("SERVER_KEY:", SERVER_KEY ? "✓" : "✗");
} else {
  console.log("✓ Midtrans configuration loaded successfully");
  console.log("  MERCHANT_ID:", MERCHANT_ID);
  console.log("  CLIENT_KEY:", CLIENT_KEY.substring(0, 20) + "...");
  console.log("  SERVER_KEY:", SERVER_KEY.substring(0, 20) + "...");
}

// Create Snap API instance
const snap = new midtransClient.Snap({
  isProduction: false, // Use sandbox for now
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
});

// Create Core API instance (for future use: VA, QRIS, etc.)
const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
});

module.exports = {
  snap,
  coreApi,
  MERCHANT_ID,
  CLIENT_KEY,
  SERVER_KEY,
};

