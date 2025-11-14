import axios from "axios";

// API Base URL
// For development: use .env.development file with VITE_API_BASE_URL=http://localhost:3000/api
// For production: use .env.production file with VITE_API_BASE_URL=https://bagas14258.duckdns.org/api
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// Debug: Log API URL untuk memastikan menggunakan URL yang benar
console.log("🔍 API Base URL:", BASE_URL);
console.log("🔍 VITE_API_BASE_URL from env:", import.meta.env.VITE_API_BASE_URL);

export const serverApi = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

serverApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("gjt_token") || localStorage.getItem("gcr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

serverApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.message || err?.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);
