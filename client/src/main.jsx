import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./store";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

// Google OAuth Client ID dari environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Debug: Log untuk memastikan env variable terbaca
console.log("🔍 Google Client ID:", GOOGLE_CLIENT_ID ? "✅ Ditemukan" : "❌ Tidak ditemukan");
if (GOOGLE_CLIENT_ID) {
  console.log("📋 Client ID:", GOOGLE_CLIENT_ID.substring(0, 20) + "...");
}

// Validasi Client ID
if (!GOOGLE_CLIENT_ID) {
  console.error("❌ VITE_GOOGLE_CLIENT_ID tidak ditemukan di environment variables!");
  console.error("Pastikan file .env ada di folder client dengan isi:");
  console.error("VITE_GOOGLE_CLIENT_ID=924748349027-rvufac6l673qsle56ukl0r1rhsg4h92m.apps.googleusercontent.com");
  console.error("⚠️ PENTING: Setelah membuat/update .env, RESTART dev server (Ctrl+C lalu npm run dev)");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      ) : (
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>⚠️ Configuration Error</h2>
          <p>Google OAuth Client ID tidak ditemukan.</p>
          <p>Pastikan file <code>.env</code> ada di folder <code>client</code> dengan isi:</p>
          <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px" }}>
            VITE_GOOGLE_CLIENT_ID=924748349027-rvufac6l673qsle56ukl0r1rhsg4h92m.apps.googleusercontent.com
          </pre>
          <p>Setelah itu, <strong>restart dev server</strong> (Ctrl+C lalu npm run dev)</p>
        </div>
      )}
    </Provider>
  </React.StrictMode>
);
