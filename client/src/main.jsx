import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "./store";
import { initAuthFromStorage } from "./store/initAuth";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";

// Debug: Verify store is created
console.log("✅ Redux store created:", store ? "Success" : "Failed");
if (store) {
  console.log("✅ Store state:", store.getState());
}

// Initialize auth state from localStorage
try {
  if (store && initAuthFromStorage) {
    initAuthFromStorage(store);
    console.log("✅ Auth initialized from localStorage");
  }
} catch (error) {
  console.error("❌ Error initializing auth:", error);
}

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

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error);
    console.error("Error info:", errorInfo);
    console.error("Error stack:", error?.stack);
    this.setState({ 
      hasError: true, 
      error: error,
      errorInfo: errorInfo 
    });
  }

  render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      const errorStack = error?.stack || "";
      
      return (
        <div style={{ padding: "2rem", textAlign: "center", maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ color: "#dc3545" }}>⚠️ Application Error</h2>
          <p>Something went wrong. Please check the details below.</p>
          <details style={{ marginTop: "1rem", textAlign: "left", background: "#f8f9fa", padding: "1rem", borderRadius: "8px" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold", marginBottom: "0.5rem" }}>Error Details (Click to expand)</summary>
            <div style={{ marginTop: "1rem" }}>
              <p><strong>Error Message:</strong></p>
              <pre style={{ background: "#fff", padding: "1rem", borderRadius: "4px", overflow: "auto", border: "1px solid #dee2e6" }}>
                {errorMessage}
              </pre>
              {errorStack && (
                <>
                  <p style={{ marginTop: "1rem" }}><strong>Stack Trace:</strong></p>
                  <pre style={{ background: "#fff", padding: "1rem", borderRadius: "4px", overflow: "auto", border: "1px solid #dee2e6", fontSize: "0.85rem" }}>
                    {errorStack}
                  </pre>
                </>
              )}
            </div>
          </details>
          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ 
                marginRight: "0.5rem",
                padding: "0.5rem 1rem", 
                background: "#0d6efd",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ 
                padding: "0.5rem 1rem", 
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Clear Cache & Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ensure root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  document.body.innerHTML = `
    <div style="padding: 2rem; text-align: center;">
      <h2>⚠️ Fatal Error</h2>
      <p>Root element (#root) not found in HTML.</p>
      <p>Please check index.html file.</p>
    </div>
  `;
} else {
  try {
    console.log("✅ Root element found, rendering app...");
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
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
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("✅ App rendered successfully");
  } catch (error) {
    console.error("❌ Fatal error during app initialization:", error);
    console.error("Error stack:", error?.stack);
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h2>⚠️ Fatal Error</h2>
        <p>Failed to initialize application.</p>
        <details style="margin-top: 1rem; text-align: left;">
          <summary>Error Details</summary>
          <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; text-align: left; overflow: auto;">
            ${error.toString()}
            ${error?.stack || ""}
          </pre>
        </details>
        <p>Please check the console for more details.</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #0d6efd; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Refresh Page
        </button>
      </div>
    `;
  }
}
